from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import pandas as pd
import json
import os
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# Configurações
CORS(app, origins=["http://localhost:3000"])
jwt = JWTManager(app)
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

# Criar diretório de uploads
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def init_db():
    """Inicializar banco de dados SQLite"""
    conn = sqlite3.connect('expensify.db')
    cursor = conn.cursor()
    
    # Tabela de usuários
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            partner_user_id TEXT NOT NULL,
            partner_user_secret TEXT NOT NULL,
            policy_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabela de histórico
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS upload_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            filename TEXT,
            total_expenses INTEGER,
            success_count INTEGER,
            error_count INTEGER,
            total_amount REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Inicializar BD
init_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        
        # Validar campos obrigatórios
        required = ['email', 'password', 'partner_user_id', 'partner_user_secret', 'policy_id']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se email já existe
        conn = sqlite3.connect('expensify.db')
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE email = ?', (data['email'],))
        
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Criar usuário
        password_hash = generate_password_hash(data['password'])
        cursor.execute('''
            INSERT INTO users (email, password_hash, partner_user_id, partner_user_secret, policy_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['email'], password_hash, data['partner_user_id'], 
              data['partner_user_secret'], data['policy_id']))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Criar token JWT
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user_id,
                'email': data['email'],
                'partner_user_id': data['partner_user_id'],
                'policy_id': data['policy_id']
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email e senha obrigatórios'}), 400
        
        conn = sqlite3.connect('expensify.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, email, password_hash, partner_user_id, policy_id, created_at
            FROM users WHERE email = ?
        ''', (data['email'],))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user or not check_password_hash(user[2], data['password']):
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        access_token = create_access_token(identity=user[0])
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user[0],
                'email': user[1],
                'partner_user_id': user[3],
                'policy_id': user[4],
                'created_at': user[5]
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        
        conn = sqlite3.connect('expensify.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, email, partner_user_id, policy_id, created_at
            FROM users WHERE id = ?
        ''', (user_id,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        return jsonify({
            'user': {
                'id': user[0],
                'email': user[1],
                'partner_user_id': user[2],
                'policy_id': user[3],
                'created_at': user[4]
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_expenses():
    try:
        user_id = get_jwt_identity()
        
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        employee_email = request.form.get('employee_email')
        
        if not employee_email:
            return jsonify({'error': 'Email do funcionário obrigatório'}), 400
        
        if file.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Tipo de arquivo não permitido'}), 400
        
        # Salvar arquivo temporariamente
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        try:
            # Processar Excel
            df = pd.read_excel(filepath)
            
            # Mapear colunas comuns
            column_mapping = {
                'data': 'date',
                'movimentação': 'merchant',
                'merchant': 'merchant',
                'valor em brl': 'amount',
                'amount': 'amount',
                'valor': 'amount'
            }
            
            # Renomear colunas
            df_renamed = df.rename(columns={col: column_mapping.get(col.lower(), col) 
                                          for col in df.columns})
            
            expenses = []
            for _, row in df_renamed.iterrows():
                try:
                    expense = {
                        'merchant': str(row.get('merchant', 'Despesa Importada')),
                        'amount': float(row.get('amount', 0)),
                        'date': parse_date(row.get('date')),
                        'category': categorize_expense(str(row.get('merchant', ''))),
                        'employee_email': employee_email
                    }
                    
                    if expense['amount'] > 0:
                        expenses.append(expense)
                except:
                    continue
            
            # Salvar no histórico
            conn = sqlite3.connect('expensify.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO upload_history (user_id, filename, total_expenses, total_amount)
                VALUES (?, ?, ?, ?)
            ''', (user_id, filename, len(expenses), sum(e['amount'] for e in expenses)))
            conn.commit()
            conn.close()
            
            return jsonify({
                'expense_count': len(expenses),
                'total_amount': sum(e['amount'] for e in expenses)
            })
            
        finally:
            # Limpar arquivo
            if os.path.exists(filepath):
                os.remove(filepath)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def parse_date(date_value):
    """Converter vários formatos de data"""
    if pd.isna(date_value):
        return datetime.now().strftime('%Y-%m-%d')
    
    if isinstance(date_value, str):
        if '.' in date_value:
            try:
                parts = date_value.split('.')
                return f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
            except:
                pass
    
    try:
        return pd.to_datetime(date_value).strftime('%Y-%m-%d')
    except:
        return datetime.now().strftime('%Y-%m-%d')

def categorize_expense(merchant):
    """Categorizar despesa baseado no merchant"""
    merchant_lower = merchant.lower()
    
    if any(word in merchant_lower for word in ['uber', 'taxi', 'bolt']):
        return 'Travel'
    elif any(word in merchant_lower for word in ['aws', 'azure', 'google cloud', 'anthropic']):
        return 'Software'
    elif any(word in merchant_lower for word in ['restaurant', 'food', 'meal']):
        return 'Meals'
    else:
        return 'Other'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
