# 🗃️ Pokemon Logger - Comandos de Banco de Dados

## Comandos Básicos SQLite

### 1. Entrar no modo interativo
```bash
cd backend
sqlite3 src/pokemon_logger.db
```

### 2. Comandos dentro do SQLite
```sql
-- Listar tabelas
.tables

-- Ver estrutura de uma tabela
.schema users
.schema user_pokemon

-- Sair
.exit
```

## 📊 Consultas Úteis

### Usuários
```bash
# Contar usuários
sqlite3 src/pokemon_logger.db "SELECT COUNT(*) FROM users;"

# Listar todos os usuários
sqlite3 src/pokemon_logger.db "SELECT id, email, name, createdAt FROM users;"

# Usuário específico
sqlite3 src/pokemon_logger.db "SELECT * FROM users WHERE email = 'seu@email.com';"
```

### Pokemon
```bash
# Contar pokemon por usuário
sqlite3 src/pokemon_logger.db "SELECT userId, COUNT(*) as total FROM user_pokemon GROUP BY userId;"

# Listar pokemon de um usuário
sqlite3 src/pokemon_logger.db "SELECT pokemonName, category, notes, dateAdded FROM user_pokemon WHERE userId = 'USER_ID';"

# Pokemon por categoria
sqlite3 src/pokemon_logger.db "SELECT category, COUNT(*) as total FROM user_pokemon GROUP BY category;"

# Últimos pokemon adicionados
sqlite3 src/pokemon_logger.db "SELECT pokemonName, category, dateAdded FROM user_pokemon ORDER BY dateAdded DESC LIMIT 10;"
```

### Consultas Avançadas
```bash
# Pokemon com detalhes do usuário
sqlite3 src/pokemon_logger.db "
SELECT 
  u.name as trainer_name,
  u.email,
  p.pokemonName,
  p.category,
  p.notes,
  p.dateAdded
FROM users u 
JOIN user_pokemon p ON u.id = p.userId 
ORDER BY p.dateAdded DESC;
"

# Estatísticas por usuário
sqlite3 src/pokemon_logger.db "
SELECT 
  u.name,
  COUNT(p.id) as total_pokemon,
  COUNT(CASE WHEN p.category = 'caught' THEN 1 END) as caught,
  COUNT(CASE WHEN p.category = 'want-to-catch' THEN 1 END) as want_to_catch,
  COUNT(CASE WHEN p.category = 'favorites' THEN 1 END) as favorites
FROM users u 
LEFT JOIN user_pokemon p ON u.id = p.userId 
GROUP BY u.id, u.name;
"
```

## 🔧 Modo Interativo Avançado

```bash
# Entrar no SQLite com formatação bonita
sqlite3 src/pokemon_logger.db
```

Dentro do SQLite:
```sql
-- Configurar output bonito
.mode column
.headers on
.width 15 15 20 15 10

-- Agora suas consultas ficam formatadas
SELECT * FROM users;
```

## 📱 Interface Visual (Opcional)

Se quiser uma interface gráfica, você pode usar:
- **DB Browser for SQLite**: https://sqlitebrowser.org/
- **DBeaver**: https://dbeaver.io/
- **VSCode SQLite Extension**

Basta apontar para o arquivo: `backend/src/pokemon_logger.db`