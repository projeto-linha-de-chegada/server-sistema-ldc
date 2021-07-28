DROP TABLE IF EXISTS alunos;

--tabela para os alunos já aprovados pelo administrador
CREATE TABLE IF NOT EXISTS alunos(
	id SERIAL NOT NULL,
	nome VARCHAR(50) NOT NULL,
	email VARCHAR(50) NOT NULL,
	senha VARCHAR(50) NOT NULL,
	matricula VARCHAR(50) NOT NULL,
	curso VARCHAR(100) NOT NULL,
	usertoken VARCHAR(100) NOT NULL UNIQUE,
	ativo BOOLEAN NOT NULL DEFAULT TRUE,
	data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id)
);

--INSERT INTO alunos (nome,email,senha,matricula,curso,usertoken) VALUES ('Felipe','felipe@gmail.com','lollol',412649,'engenharia',123);
--SELECT * FROM alunos;

DROP TABLE IF EXISTS alunos_pendentes;

--tabela para alunos que ainda não tiveram cadastro aprovado pela coordenação
CREATE TABLE IF NOT EXISTS alunos_pendentes(
	id SERIAL NOT NULL,
	nome VARCHAR(50) NOT NULL,
	email VARCHAR(50) NOT NULL,
	senha VARCHAR(50) NOT NULL,
	matricula VARCHAR(50) NOT NULL,
	curso VARCHAR(100) NOT NULL,
	usertoken VARCHAR(100) NOT NULL UNIQUE,
	ativo BOOLEAN NOT NULL DEFAULT TRUE,
	data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id)
);

--INSERT INTO alunos_pendentes (nome,email,senha,matricula,curso,usertoken) VALUES ('Felipe','felipe@gmail.com','lollol',412649,'engenharia',123);
--SELECT * FROM alunos_pendentes;

CREATE TABLE IF NOT EXISTS atividades(
	id SERIAL NOT NULL,
	titulo VARCHAR(50) NOT NULL,
	data_inicio VARCHAR(50) NOT NULL,
	data_fim VARCHAR(50) NOT NULL,
	descricao VARCHAR(3000) NOT NULL,
	quantidade_horas VARCHAR(10) NOT NULL,
	usertoken VARCHAR(100) NOT NULL,
	link VARCHAR(200),
	pdf OID,
	data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	FOREIGN KEY (usertoken) REFERENCES alunos (usertoken)
);
