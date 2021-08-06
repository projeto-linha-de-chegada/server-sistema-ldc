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
app.post("/alunosPendentes", async (req, res) => {
  try {
    const newAluno = req.body;

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
    return;

  } catch (err) {
    console.log(err);
    res.json("Um erro ocorreu!");
    return;
  }
});

//Buscar aluno especifico na tabela alunos pendentes
app.post("/alunos/verifyP", async (req, res) => {
  try {
    const myJSON = req.body;

    const users = await pool.query("SELECT * FROM alunos_pendentes WHERE email = $1 and senha = $2", [
      myJSON.email, myJSON.senha
    ]);

    if (users.rowCount < 1) {
      res.json([]);
      return;
    }
    else {
      res.json(users.rows[0]);
      return;
    }

  } catch (err) {
    console.log(err);
    res.json([]);
    return;
  }
});

//************************************ALUNOS*********************************************************
//verificar se existe um aluno especifico na tabela alunos
app.post("/alunos/verify", async (req, res) => {
  try {
    const myJSON = req.body;

    const users = await pool.query("SELECT * FROM alunos WHERE email = $1 and senha = $2", [
      myJSON.email, myJSON.senha
    ]);

    if (users.rowCount < 1) {
      res.json([]);
      return;
    }
    else {
      res.json(users.rows[0]);
      return;
    }

  } catch (err) {
    console.log(err);
    res.json([]);
    return;
  }
});


//************************************ATIVIDADES DOS ALUNOS***************************************************
//cadastrar atividade de aluno com pdf

app.post("/atividades", async (req, res) => {
  try {
    const myJSON = req.body;

    const row = await pool.query("INSERT INTO atividades(titulo, data_inicio, data_fim, categoria, sub_categoria, descricao, quantidade_horas, usertoken, doc_link, nome_pdf) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [
      myJSON.titulo, myJSON.dataInicio, myJSON.dataFim, myJSON.selectedCategoria, myJSON.selectedSubCategoria, myJSON.descricao, myJSON.quantHoras, myJSON.token, myJSON.link, myJSON.nomePdf
    ]);

    res.json("Atividade Cadastrada");
    return;

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
    return;
  }
});

//Retornar todas as atividades de um aluno

app.get("/atividades/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const busca = await pool.query("SELECT * FROM atividades WHERE usertoken = $1", [
      token
    ]);

    if (busca.rowCount < 1) {
      res.json([]);
      return;
    }
    else {
      res.json(busca.rows);
      return;
    }

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
    return;
  }
});


//cadastrar pdf de uma atividade

app.post("/atividades/pdf/:nome", async (req, res) => {
  try {
    const { nome } = req.params;
    const file = fs.createWriteStream("uploads/" + nome);
    req.on("data", chunk => {
      file.write(chunk);
    })
    req.on("end", () => {
      file.end();
      res.json("PDF Cadastrado");
      return;
    })

  } catch (err) {
    console.log(err);
    res.json("");
    return;
  }
});

//enviar pdf para o client side
app.get('/download/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    var filePath = "/uploads/" + nome; //caminho do arquivo completo
    console.log("Gerando link de acesso ao arquivo: " + filePath);
    res.sendFile(__dirname + filePath);
    return;
  } catch (err) {
    console.log(err);
    return;
  }
});

//update atividade com pdf

app.put("/atividades/pdf/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const myJSON = req.body;

    //deletar pdf antigo
    //var filePath = __dirname + "\\uploads\\" + myJSON.nomeAntigoPdf;
    //fs.unlinkSync(filePath);

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
    return;
  } catch (err) {
    console.log(err);
    res.json("Um erro ocorreu!");
    return;
  }
});

app.put("/atividades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const myJSON = req.body;

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
    return;
  } catch (err) {
    console.log(err);
    res.json("Um erro ocorreu!");
    return;
  }
});

//************************************Admins***************************************************
//retorna todos os alunos pendentes

app.get("/alunosPendentes/:token", async (req, res) => {
  try {

    const { token } = req.params;

    const validarPermissao = await pool.query("SELECT * FROM admins WHERE usertoken = $1", [
      token
    ]);

    if (validarPermissao.rowCount < 1) {
      res.json([]);
      return;
    }

    const allAlunos = await pool.query("SELECT * FROM alunos_pendentes");

    if (allAlunos.rowCount < 1) {
      res.json([]);
      return;
    }

    else {
      res.json(allAlunos.rows);
      return;
    }

  } catch (err) {
    console.log(err);
    res.json([]);
    return;
  }
});

//retorna todos os alunos aprovados

app.get("/alunos/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const validarPermissao = await pool.query("SELECT * FROM admins WHERE usertoken = $1", [
      token
    ]);

    if (validarPermissao.rowCount < 1) {
      res.json([]);
      return;
    }

    const allAlunos = await pool.query("SELECT * FROM alunos");

    if (allAlunos.rowCount < 1) {
      res.json([]);
      return;
    }

    else {
      res.json(allAlunos.rows);
      return;
    }

  } catch (err) {
    console.log(err);
    res.json([]);
    return;
  }
});

//retorna todos os professores

app.get("/professores/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const validarPermissao = await pool.query("SELECT * FROM admins WHERE usertoken = $1", [
      token
    ]);

    if (validarPermissao.rowCount < 1) {
      res.json([]);
      return;
    }

    const allAlunos = await pool.query("SELECT * FROM professores");

    if (allAlunos.rowCount < 1) {
      res.json([]);
      return;
    }

    else {
      res.json(allAlunos.rows);
      return;
    }

  } catch (err) {
    console.log(err);
    res.json([]);
    return;
  }
});

//cria professor 
app.post("/professores/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const myJSON = req.body;

    const validarPermissao = await pool.query(
      "SELECT * FROM admins WHERE usertoken = $1",
      [token]
    );

    if (validarPermissao.rowCount < 1) {
      res.json("Operação Inválida: Sem permissão de administrador");
      return;
    }

    const validarInsert = await pool.query(
      "SELECT * FROM professores WHERE email = $1",
      [myJSON.email]
    );

    if (validarInsert.rowCount > 0) {
      res.json("Já existe professor com esse Email");
      return;
    }

    const insertProfessor = await pool.query(
      "INSERT INTO professores (nome, matricula, email, senha, usertoken) VALUES ($1,$2,$3,$4,$5)",
      [myJSON.nome, myJSON.matricula, myJSON.email, myJSON.senha, myJSON.usertoken]
    );

    res.json("Professor Cadastrado");
    return;

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
  }
});

//transforma aluno pendente em aluno
app.post("/liberarAcessoAluno", async (req, res) => {
  try {
    const myJSON = req.body;
    const token = myJSON.token;
    const id = myJSON.id;

    const validarPermissao = await pool.query(
      "SELECT * FROM admins WHERE usertoken = $1",
      [token]
    );

    if (validarPermissao.rowCount < 1) {
      res.json("Operação Inválida: Sem permissão de administrador");
      return;
    }

    const buscaAlunoPendente = await pool.query(
      "SELECT * FROM alunos_pendentes WHERE id = $1",
      [id]
    );

    if (buscaAlunoPendente.rowCount > 0) {
      try {

        const newAluno = await pool.query(
          "INSERT INTO alunos (nome,email,senha,matricula,curso,usertoken,data_criacao) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [buscaAlunoPendente.rows[0].nome, buscaAlunoPendente.rows[0].email,
          buscaAlunoPendente.rows[0].senha, buscaAlunoPendente.rows[0].matricula,
          buscaAlunoPendente.rows[0].curso, buscaAlunoPendente.rows[0].usertoken,
          buscaAlunoPendente.rows[0].data_criacao]
        );

        const deleteAlunoPendente = await pool.query("DELETE FROM alunos_pendentes WHERE id = $1", [
          id
        ]);

        res.json("Acesso liberado para aluno: " + buscaAlunoPendente.rows[0].nome);
        return;

      } catch (err) {
        console.log(err);
        res.json("Um problema ocorreu!");
        return;
      }
    }

    res.json("Um problema ocorreu");
    return;

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
    return;
  }
});


//nega acesso ao aluno pendente // remove ele da tabela...
app.post("/negarAcessoAluno", async (req, res) => {
  try {
    const myJSON = req.body;
    const token = myJSON.token;
    const id = myJSON.id;

    const validarPermissao = await pool.query(
      "SELECT * FROM admins WHERE usertoken = $1",
      [token]
    );

    if (validarPermissao.rowCount < 1) {
      res.json("Operação Inválida: Sem permissão de administrador");
      return;
    }

    const alunoPendente = await pool.query("SELECT * FROM alunos_pendentes WHERE id = $1", [
      id
    ]);

    const deleteAlunoPendente = await pool.query("DELETE FROM alunos_pendentes WHERE id = $1", [
      id
    ]);

    res.json("Acesso negado para: " + alunoPendente.rows[0].nome);
    return;

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
    return;
  }
});


//desativar aluno
app.put("/desativarAluno", async (req, res) => {
  try {
    const myJSON = req.body;
    const token = myJSON.token;
    const id = myJSON.id;

    const validarPermissao = await pool.query(
      "SELECT * FROM admins WHERE usertoken = $1",
      [token]
    );

    if (validarPermissao.rowCount < 1) {
      res.json("Operação Inválida: Sem permissão de administrador");
      return;
    }

    const aluno = await pool.query("SELECT * FROM alunos WHERE id = $1", [
      id
    ]);

    const update = await pool.query("UPDATE alunos SET ativo = $1 WHERE id = $2", [
      false, id
    ]);

    res.json("Acesso suspenso para: " + aluno.rows[0].nome);
    return;

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
    return;
  }
});

//ativar aluno
app.put("/ativarAluno", async (req, res) => {
  try {
    const myJSON = req.body;
    const token = myJSON.token;
    const id = myJSON.id;

    const validarPermissao = await pool.query(
      "SELECT * FROM admins WHERE usertoken = $1",
      [token]
    );

    if (validarPermissao.rowCount < 1) {
      res.json("Operação Inválida: Sem permissão de administrador");
      return;
    }

    const aluno = await pool.query("SELECT * FROM alunos WHERE id = $1", [
      id
    ]);

    const update = await pool.query("UPDATE alunos SET ativo = $1 WHERE id = $2", [
      true, id
    ]);

    res.json("Acesso reativado para: " + aluno.rows[0].nome);
    return;

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
    return;
  }
});



//desativar professor
app.put("/desativarProfessor", async (req, res) => {
  try {
    const myJSON = req.body;
    const token = myJSON.token;
    const id = myJSON.id;

    const validarPermissao = await pool.query(
      "SELECT * FROM admins WHERE usertoken = $1",
      [token]
    );

    if (validarPermissao.rowCount < 1) {
      res.json("Operação Inválida: Sem permissão de administrador");
      return;
    }

    const professor = await pool.query("SELECT * FROM professores WHERE id = $1", [
      id
    ]);

    const update = await pool.query("UPDATE professores SET ativo = $1 WHERE id = $2", [
      false, id
    ]);

    res.json("Acesso suspenso para: " + professor.rows[0].nome);
    return;

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
    return;
  }
});

//ativar professor
app.put("/ativarProfessor", async (req, res) => {
  try {
    const myJSON = req.body;
    const token = myJSON.token;
    const id = myJSON.id;

    const validarPermissao = await pool.query(
      "SELECT * FROM admins WHERE usertoken = $1",
      [token]
    );

    if (validarPermissao.rowCount < 1) {
      res.json("Operação Inválida: Sem permissão de administrador");
      return;
    }

    const professor = await pool.query("SELECT * FROM professores WHERE id = $1", [
      id
    ]);

    const update = await pool.query("UPDATE professores SET ativo = $1 WHERE id = $2", [
      true, id
    ]);

    res.json("Acesso reativado para: " + professor.rows[0].nome);
    return;

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
    return;
  }
});

//************************************CONTROLE DE ACESSO***************************************************
app.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const isProfessor = await pool.query(
      "SELECT * FROM professores WHERE usertoken = $1",
      [token]
    );

    if (isProfessor.rowCount > 0) {
      res.json("professor");
      return;
    }

    const isAdmin = await pool.query(
      "SELECT * FROM admins WHERE usertoken = $1",
      [token]
    );

    if (isAdmin.rowCount > 0) {
      res.json("admin");
      return;
    }

    const isAluno = await pool.query(
      "SELECT * FROM alunos WHERE usertoken = $1",
      [token]
    );

    if (isAluno.rowCount > 0) {
      res.json("aluno");
      return;
    }

    res.json("");

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
  }
});

//verifica se admin existe
app.post("/admins/verify", async (req, res) => {
  try {
    const myJSON = req.body;

    const validarInsert = await pool.query(
      "SELECT * FROM admins WHERE email = $1 and senha = $2",
      [myJSON.email, myJSON.senha]
    );

    if (validarInsert.rowCount > 0) {
      res.json(validarInsert.rows[0]);
      return;
    }

    res.json([]);

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
  }
});

//verifica se professor existe
app.post("/professores-verify", async (req, res) => {
  try {
    const myJSON = req.body;

    const validarInsert = await pool.query(
      "SELECT * FROM professores WHERE email = $1 and senha = $2",
      [myJSON.email, myJSON.senha]
    );

    if (validarInsert.rowCount > 0) {
      res.json(validarInsert.rows[0]);
      return;
    }

    res.json([]);

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
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