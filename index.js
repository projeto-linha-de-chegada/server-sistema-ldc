const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const path = require("path");
const fs = require("fs");
const { get } = require("http");

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

//criar uma solicitação
app.get("/solicitacao/:token", async (req, res) => {
  try {

    const {token} = req.params;
    const myJSON = req.body;

    const isAluno = await pool.query(
      "SELECT * FROM alunos WHERE usertoken = $1",
      [token]
    );

    if(isAluno.rowCount < 1){
      res.json("Operação Inválida: Sem permissão de aluno");
      return;
    }


    //escolher o avaliador que receberá a submissão
    const findAvaliadores = await pool.query("SELECT * FROM avaliadores ORDER BY id");

    if(findAvaliadores.rowCount < 1){
      res.json("Não há avaliadores disponiveis, tente mais tarde!");
      return;
    }

    var avaliadorEscolhido = [];
    const getAvaliadorEscolhidoNumber = await pool.query("SELECT * FROM avaliador_selecionado");
    
    //Se nunca foi selecionado alguem, o proximo avaliador será o primeiro da lista
    if(getAvaliadorEscolhidoNumber.rowCount < 1){
      avaliadorEscolhido = findAvaliadores.rows[0];
      const setAvaliador = await pool.query("INSERT INTO avaliador_selecionado (id_avaliador_escolhido) values ($1)", [
        findAvaliadores.rows[0].id
      ]);
    }
    else{
      for(var i = 0; i < findAvaliadores.rowCount; i++){
        //se já foi selecionado alguém antes, então o proximo da lista é o selecionado
        
        //lista de avaliadores foi toda usada... volte pro avaliador do inicio
        if(findAvaliadores.rows[findAvaliadores.rowCount - 1].id === getAvaliadorEscolhidoNumber.rows[0].id_avaliador_escolhido){
          const setAvalidor = await pool.query("UPDATE avaliador_selecionado SET id_avaliador_escolhido = $1 WHERE id = '1'",[
            findAvaliadores.rows[0].id
          ]);
          break;
        }

        //Se ainda há avaliadores não-selecionados.. busque...
        if(findAvaliadores.rows[i].id > getAvaliadorEscolhidoNumber.rows[0].id_avaliador_escolhido){
          const setAvalidor = await pool.query("UPDATE avaliador_selecionado SET id_avaliador_escolhido = $1 WHERE id = '1'",[
            findAvaliadores.rows[i].id
          ]);
          break;
          //logica de clonar as atividades
        }

        
      }
    }




    res.json("Solicitação Cadastrada");
    return;

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
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


//deletar uma atividade

app.delete("/atividades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    const deleteTodo = await pool.query("DELETE FROM atividades WHERE id = $1 AND usertoken = $2", [
      id, body.token
    ]);

    res.json("Atividade deletada");
    return;

  } catch (err) {
    console.log(err.message);
    res.json("Ocorreu um erro!");
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

//retorna todos os avaliadores

app.get("/avaliadores/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const validarPermissao = await pool.query("SELECT * FROM admins WHERE usertoken = $1", [
      token
    ]);

    if (validarPermissao.rowCount < 1) {
      res.json([]);
      return;
    }

    const allAvaliadores = await pool.query("SELECT * FROM avaliadores");

    if (allAvaliadores.rowCount < 1) {
      res.json([]);
      return;
    }

    else {
      res.json(allAvaliadores.rows);
      return;
    }

  } catch (err) {
    console.log(err);
    res.json([]);
    return;
  }
});

//cria avaliador
app.post("/avaliadores/:token", async (req, res) => {
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
      "SELECT * FROM avaliadores WHERE email = $1",
      [myJSON.email]
    );

    if (validarInsert.rowCount > 0) {
      res.json("Já existe avaliador com esse Email");
      return;
    }

    const insertAvaliador = await pool.query(
      "INSERT INTO avaliadores (nome, matricula, email, senha, usertoken) VALUES ($1,$2,$3,$4,$5)",
      [myJSON.nome, myJSON.matricula, myJSON.email, myJSON.senha, myJSON.usertoken]
    );

    res.json("Avaliador Cadastrado");
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



//desativar avaliador
app.put("/desativarAvaliador", async (req, res) => {
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

    const avaliador = await pool.query("SELECT * FROM avaliadores WHERE id = $1", [
      id
    ]);

    const update = await pool.query("UPDATE avaliadores SET ativo = $1 WHERE id = $2", [
      false, id
    ]);

    res.json("Acesso suspenso para: " + avaliador.rows[0].nome);
    return;

  } catch (err) {
    console.log(err);
    res.json("Um problema ocorreu!");
    return;
  }
});

//ativar avaliador
app.put("/ativarAvaliador", async (req, res) => {
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

    const avaliador = await pool.query("SELECT * FROM avaliadores WHERE id = $1", [
      id
    ]);

    const update = await pool.query("UPDATE avaliadores SET ativo = $1 WHERE id = $2", [
      true, id
    ]);

    res.json("Acesso reativado para: " + avaliador.rows[0].nome);
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

    const isAvaliador = await pool.query(
      "SELECT * FROM avaliadores WHERE usertoken = $1",
      [token]
    );

    if (isAvaliador.rowCount > 0) {
      res.json("avaliador");
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

//verifica se avaliador existe
app.post("/avaliadores-verify", async (req, res) => {
  try {
    const myJSON = req.body;

    const validarInsert = await pool.query(
      "SELECT * FROM avaliadores WHERE email = $1 and senha = $2",
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


app.listen(5000, () => {
  console.log("Servidor rodando na porta 5000");
});