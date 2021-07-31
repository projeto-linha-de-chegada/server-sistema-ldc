const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const path = require("path");
const fs = require("fs");

//middleware
app.use(cors());
app.use(express.json());


//************************************ALUNOS PENDENTES***************************************************
//Criar um aluno pendente

app.post("/alunos", async (req, res) => {
  try {
    const newAluno = req.body;
    console.log("Criando Aluno pendente: " + newAluno.nome + " " + newAluno.email);

    //validar criação
    const testarEmailAlunosPendentes = await pool.query(
      "SELECT * FROM alunos_pendentes WHERE email = $1", [newAluno.email]
    );

    const testarEmailAlunos = await pool.query(
      "SELECT * FROM alunos WHERE email = $1", [newAluno.email]
    );

    if (testarEmailAlunos.rowCount >= 1 || testarEmailAlunosPendentes.rowCount >= 1) {
      console.log("Email já está em uso");
      res.json("Email já está em uso");
      return;
    }

    const newAlunoPendente = await pool.query(
      "INSERT INTO alunos_pendentes (nome,email,senha,matricula,curso,usertoken) VALUES($1,$2,$3,$4,$5,$6)",
      [newAluno.nome, newAluno.email,
      newAluno.senha, newAluno.matricula,
      newAluno.curso, newAluno.usertoken]
    );

    console.log("Cadastro solicitado ao Administrador!")
    res.json("Cadastro solicitado ao Administrador!");

  } catch (err) {
    console.log(err);
    res.json("Um erro ocorreu!");
  }
});

//verificar se exite um aluno especifico na tabela alunos pendentes

app.post("/alunos/verifyP", async (req, res) => {
  try {
    const myJSON = req.body;
    console.log("Verificando existencia de aluno em pendencia: " + myJSON.email + " " + myJSON.senha);

    const users = await pool.query("SELECT * FROM alunos_pendentes WHERE email = $1 and senha = $2", [
      myJSON.email, myJSON.senha
    ]);

    if (users.rowCount < 1) {
      console.log("Aluno não encontrado na lista de pendentes")
      res.json([]);
    }
    else {
      console.log("Presente na lista de pendentes");
      res.json(users.rows[0]);
    }

  } catch (err) {
    console.log(err);
  }
});

//************************************ALUNOS COM ACESSO***************************************************

//retorna todos os alunos

app.get("/alunos", async (req, res) => {
  try {
    console.log("Buscando alunos pendentes...")
    const allAlunos = await pool.query("SELECT * FROM alunos_pendentes");

    if (allAlunos.rowCount < 1) {
      console.log("Não há alunos pendentes no banco")
      res.json([]);
    }

    else {
      console.log("Alunos pendentes encontrados!")
      res.json(allAlunos.rows);
    }

  } catch (err) {
    console.log(err);
    res.json([]);
  }
});

//verificar se existe um aluno especifico na tabela alunos

app.post("/alunos/verify", async (req, res) => {
  try {
    const myJSON = req.body;
    console.log("Verificando existencia de aluno: " + myJSON.email + " " + myJSON.senha);

    const users = await pool.query("SELECT * FROM alunos WHERE email = $1 and senha = $2", [
      myJSON.email, myJSON.senha
    ]);

    if (users.rowCount < 1) {
      console.log("Aluno não encontrado na lista de alunos")
      res.json([]);
    }
    else {
      console.log("Aluno encontrado na lista de alunos");
      res.json(users.rows[0]);
    }

  } catch (err) {
    console.log(err);
  }
});


//************************************ATIVIDADES DOS ALUNOS***************************************************

//cadastrar atividade de aluno com pdf

app.post("/atividades", async (req, res) => {
  try {
    const myJSON = req.body;
    console.log("Cadastrando nova atividade de userToken: " + myJSON.token);

    const row = await pool.query("INSERT INTO atividades(titulo, data_inicio, data_fim, categoria, sub_categoria, descricao, quantidade_horas, usertoken, doc_link, nome_pdf) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [
      myJSON.titulo, myJSON.dataInicio, myJSON.dataFim, myJSON.selectedCategoria, myJSON.selectedSubCategoria, myJSON.descricao, myJSON.quantHoras, myJSON.token, myJSON.link, myJSON.nomePdf
    ]);

    res.json("Atividade Cadastrada");

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
  }
});

//Retornar todas as atividades de um aluno

app.get("/atividades/:token", async (req, res) => {
  try {
    const { token } = req.params;
    console.log("Buscando atividades de UserToken: " + token)

    const busca = await pool.query("SELECT * FROM atividades WHERE usertoken = $1", [
      token
    ]);

    if (busca.rowCount < 1) {
      console.log("Não há registros");
      res.json([]);
    }
    else {
      console.log("Atividades encontradas!")
      res.json(busca.rows);
    }

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
  }
});


//cadastrar pdf de uma atividade

app.post("/atividades/pdf/:nome", async (req, res) => {
  try {
    const { nome } = req.params;
    console.log("Cadastrando pdf: " + nome)
    const file = fs.createWriteStream("uploads/" + nome);
    req.on("data", chunk => {
      file.write(chunk);
    })
    req.on("end", () => {
      file.end();
      res.json("PDF Cadastrado");
    })

  } catch (err) {
    console.log(err);
    res.json("")
  }
});

//enviar pdf para o cliente
app.get('/download/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    var filePath = "/uploads/" + nome; //caminho do arquivo completo
    var fileName = nome; // O nome padrão que o browser vai usar pra fazer download
    //res.download(filePath, fileName);
    console.log("Gerando link de acesso ao arquivo: " + filePath);
    res.sendFile(__dirname + filePath);
  } catch (err) {
    console.log(err);
  }
});


//update atividade com pdf

app.put("/atividades/pdf/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const myJSON = req.body;
    console.log(myJSON)
    console.log("Atualizando atividade com pdf id: " + id);
    console.log("deletando:" + __dirname + "\\uploads\\" + myJSON.nomeAntigoPdf)
    
    var filePath = __dirname + "\\uploads\\" + myJSON.nomeAntigoPdf; 
    fs.unlinkSync(filePath);

    const updateTitulo = await pool.query(
      "UPDATE atividades SET titulo = $1 WHERE id = $2",
      [myJSON.titulo, id]
    );

    const updateDataInicio = await pool.query(
      "UPDATE atividades SET data_inicio = $1 WHERE id = $2",
      [myJSON.dataInicio, id]
    );

    const updateDataFim = await pool.query(
      "UPDATE atividades SET data_fim = $1 WHERE id = $2",
      [myJSON.dataFim, id]
    );

    const updateDescricao = await pool.query(
      "UPDATE atividades SET descricao = $1 WHERE id = $2",
      [myJSON.descricao, id]
    );

    const updateQuantHoras = await pool.query(
      "UPDATE atividades SET quantidade_horas = $1 WHERE id = $2",
      [myJSON.quantHoras, id]
    );

    const updateDocLink = await pool.query(
      "UPDATE atividades SET doc_Link = $1 WHERE id = $2",
      [myJSON.docLink, id]
    );

    const updateCategoria = await pool.query(
      "UPDATE atividades SET categoria = $1 WHERE id = $2",
      [myJSON.selectedCategoria, id]
    );

    const updateSubCategoria = await pool.query(
      "UPDATE atividades SET sub_categoria = $1 WHERE id = $2",
      [myJSON.selectedSubCategoria, id]
    );

    const updateNomePdf = await pool.query(
      "UPDATE atividades SET nome_pdf = $1 WHERE id = $2",
      [myJSON.nomePdf, id]
    );

    res.json("Atividade Atualizada!");
  } catch (err) {
    console.log(err);
    res.json("Um erro ocorreu!");
  }
});

app.put("/atividades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const myJSON = req.body;
    console.log("Atualizando atividade id: " + id);

    const updateTitulo = await pool.query(
      "UPDATE atividades SET titulo = $1 WHERE id = $2",
      [myJSON.titulo, id]
    );

    const updateDataInicio = await pool.query(
      "UPDATE atividades SET data_inicio = $1 WHERE id = $2",
      [myJSON.dataInicio, id]
    );

    const updateDataFim = await pool.query(
      "UPDATE atividades SET data_fim = $1 WHERE id = $2",
      [myJSON.dataFim, id]
    );

    const updateDescricao = await pool.query(
      "UPDATE atividades SET descricao = $1 WHERE id = $2",
      [myJSON.descricao, id]
    );

    const updateQuantHoras = await pool.query(
      "UPDATE atividades SET quantidade_horas = $1 WHERE id = $2",
      [myJSON.quantHoras, id]
    );

    const updateDocLink = await pool.query(
      "UPDATE atividades SET doc_Link = $1 WHERE id = $2",
      [myJSON.docLink, id]
    );

    const updateCategoria = await pool.query(
      "UPDATE atividades SET categoria = $1 WHERE id = $2",
      [myJSON.selectedCategoria, id]
    );

    const updateSubCategoria = await pool.query(
      "UPDATE atividades SET sub_categoria = $1 WHERE id = $2",
      [myJSON.selectedSubCategoria, id]
    );

    const updateNomePdf = await pool.query(
      "UPDATE atividades SET nome_pdf = $1 WHERE id = $2",
      [myJSON.nomePdf, id]
    );

    res.json("Atividade Atualizada!");
  } catch (err) {
    console.log(err);
    res.json("Um erro ocorreu!");
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
