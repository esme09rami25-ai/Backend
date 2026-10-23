require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Conexión a MySQL adaptada para Aiven y Render
const conexion = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10
});

conexion.getConnection((err, conn) => {
  if (err) {
    console.error('Error de conexión a la BD: ', err);
    return;
  }
  console.log('Conectado exitosamente a MySQL en Aiven');
  conn.release();
});

// ==========================================
// CRUD ESTUDIANTES
// ==========================================

app.get('/estudiantes', (req, res) => {
  conexion.query('SELECT * FROM estudiantes', (err, resultados) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(resultados);
  });
});

app.post('/estudiantes', (req, res) => {
  const { nombre, grupo } = req.body;
  conexion.query(
    'INSERT INTO estudiantes (nombre, grupo) VALUES (?, ?)',
    [nombre, grupo],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ mensaje: `Estudiante agregado: ${nombre}`, id: result.insertId });
    }
  );
});

app.put('/estudiantes/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, grupo } = req.body;
  conexion.query(
    'UPDATE estudiantes SET nombre=?, grupo=? WHERE id=?',
    [nombre, grupo, id],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: `Estudiante con ID ${id} actualizado` });
    }
  );
});

app.delete('/estudiantes/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM estudiantes WHERE id=?', [id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: `Estudiante con ID ${id} eliminado` });
  });
});

// ==========================================
// CRUD PRODUCTOS
// ==========================================

app.get('/productos', (req, res) => {
  conexion.query('SELECT * FROM productos', (err, resultados) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(resultados);
  });
});

app.post('/productos', (req, res) => {
  const { nombre, precio } = req.body;
  conexion.query(
    'INSERT INTO productos (nombre, precio) VALUES (?, ?)',
    [nombre, precio],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ mensaje: `Producto agregado: ${nombre}`, id: result.insertId });
    }
  );
});

app.put('/productos/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, precio } = req.body;
  conexion.query(
    'UPDATE productos SET nombre=?, precio=? WHERE id=?',
    [nombre, precio, id],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: `Producto con ID ${id} actualizado` });
    }
  );
});

app.delete('/productos/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM productos WHERE id=?', [id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: `Producto con ID ${id} eliminado` });
  });
});

// ==========================================
// CRUD VENTAS (con JOIN)
// ==========================================

app.get('/ventas', (req, res) => {
  const sql = `
    SELECT v.id, e.nombre AS estudiante, p.nombre AS producto,
           v.cantidad, v.fecha, p.precio, (v.cantidad * p.precio) AS total
    FROM ventas v
    INNER JOIN estudiantes e ON v.estudiante_id = e.id
    INNER JOIN productos p ON v.producto_id = p.id
  `;
  conexion.query(sql, (err, resultados) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(resultados);
  });
});

app.post('/ventas', (req, res) => {
  const { estudiante_id, producto_id, cantidad, fecha } = req.body;
  const sql = 'INSERT INTO ventas (estudiante_id, producto_id, cantidad, fecha) VALUES (?, ?, ?, ?)';
  
  conexion.query(sql, [estudiante_id, producto_id, cantidad, fecha], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ mensaje: 'Venta registrada con éxito', id: result.insertId });
  });
});

app.put('/ventas/:id', (req, res) => {
  const id = req.params.id;
  const { estudiante_id, producto_id, cantidad, fecha } = req.body;
  const sql = 'UPDATE ventas SET estudiante_id=?, producto_id=?, cantidad=?, fecha=? WHERE id=?';

  conexion.query(sql, [estudiante_id, producto_id, cantidad, fecha, id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: `Venta con ID ${id} actualizada` });
  });
});

app.delete('/ventas/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM ventas WHERE id=?', [id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: `Venta con ID ${id} eliminada` });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});