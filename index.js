const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const { json } = require("express");
var FormData = require('form-data');
var fs = require('fs');
const http = require("http");
const path = require("path");

//middleware
app.use(cors());
app.use(express.json()); //req.body

//pdf
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null,"uploads/")
  },
  filename: function(req, file, cb){
    cb(null, file.originalname + Date.now() + path.extname(file.originalname));
  }
})
const uploadPdf = multer({storage});

//ROUTES//


//************************************CADASTRO ALUNO***************************************************
//Criar um aluno pendente

app.post("/alunos", async (req, res) => {
  try {
    const newAluno = req.body;
    console.log(newAluno);

    //validar criação

    const testarEmailAlunosPendentes = await pool.query(
      "SELECT * FROM alunos_pendentes WHERE email = $1", [newAluno.email]
    );

    const testarEmailAlunos = await pool.query(
      "SELECT * FROM alunos WHERE email = $1", [newAluno.email]
    );

    if (testarEmailAlunos.rowCount >= 1 || testarEmailAlunosPendentes.rowCount >= 1) {
      res.json("Email já está em uso");
      return;
    }

    const newAlunoPendente = await pool.query(
      "INSERT INTO alunos_pendentes (nome,email,senha,matricula,curso,usertoken) VALUES($1,$2,$3,$4,$5,$6)",
      [newAluno.nome, newAluno.email,
      newAluno.senha, newAluno.matricula,
      newAluno.curso, newAluno.usertoken]
    );

    res.json("Cadastro solicitado ao Administrador!");

  } catch (err) {

    res.json("Um erro ocorreu!");
  }
});

//******************************GetAlunos*********************************************/

//retorna todos os alunos

app.get("/alunos", async (req, res) => {
  try {

    const allAlunos = await pool.query("SELECT * FROM alunos_pendentes");

    if (allAlunos.rowCount < 1) {
      res.json([]);
    }

    else {
      res.json(allAlunos.rows);
    }

  } catch (err) {
    res.json([]);
  }
});

//verificar se existe um aluno especifico na tabela alunos

app.post("/alunos/verify", async (req, res) => {
  try {
    const myJSON = req.body;
    console.log(myJSON.email + " " + myJSON.senha);

    const users = await pool.query("SELECT * FROM alunos WHERE email = $1 and senha = $2", [
      myJSON.email, myJSON.senha
    ]);

    if (users.rowCount < 1) {
      console.log("usuario invalido")
      res.json([]);
    }
    else {
      console.log(users.rows[0]);
      res.json(users.rows[0]);
    }

  } catch (err) {
    console.error(err.message);
  }
});

//verificar se exite um aluno especifico na tabela alunos pendentes

app.post("/alunos/verifyP", async (req, res) => {
  try {
    const myJSON = req.body;
    console.log(myJSON.email + " " + myJSON.senha);

    const users = await pool.query("SELECT * FROM alunos_pendentes WHERE email = $1 and senha = $2", [
      myJSON.email, myJSON.senha
    ]);

    if (users.rowCount < 1) {
      console.log("usuario pendente invalido")
      res.json([]);
    }
    else {
      console.log(users.rows[0]);
      res.json(users.rows[0]);
    }

  } catch (err) {
    console.error(err.message);
  }
});

//cadastrar atividade de aluno sem pdf

app.post("/atividades", async (req, res) => {
  try {
    const myJSON = req.body;
    console.log(myJSON);

    res.json("Atividade Cadastrada");

  } catch (err) {
    console.log(err);
  }
});


//cadastrar atividade de aluno com pdf

app.post("/atividades/pdf", uploadPdf.single("file"), async (req, res) => {
  try {
    const myJSON = req.body;
    console.log(myJSON);

    res.json("Atividade Cadastrada");

  } catch (err) {
    console.error(err.message);
  }
});


//update a todo

app.put("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const updateTodo = await pool.query(
      "UPDATE todo SET description = $1 WHERE todo_id = $2",
      [description, id]
    );

    res.json("Todo was updated!");
  } catch (err) {
    console.error(err.message);
  }
});

//delete a todo

app.delete("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteTodo = await pool.query("DELETE FROM todo WHERE todo_id = $1", [
      id
    ]);
    res.json("Todo was deleted!");
  } catch (err) {
    console.log(err.message);
  }
});

app.listen(5000, () => {
  console.log("Servidor rodando na porta 5000");
});
