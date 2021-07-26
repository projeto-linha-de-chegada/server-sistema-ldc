DROP TABLE IF EXISTS alunos;

--tabela para os alunos já aprovados pelo administrador
CREATE TABLE IF NOT EXISTS alunos(
	id SERIAL NOT NULL,
	nome VARCHAR(50) NOT NULL,
	email VARCHAR(50) NOT NULL,
	senha VARCHAR(50) NOT NULL,
	matricula VARCHAR(50) NOT NULL,
	curso VARCHAR(100) NOT NULL,
	usertoken VARCHAR(100) NOT NULL,
	ativo BOOLEAN NOT NULL DEFAULT TRUE,
	data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id)
);

INSERT INTO alunos (nome,email,senha,matricula,curso,usertoken) VALUES ('Felipe','felipe@gmail.com','lollol',412649,'engenharia',123);
SELECT * FROM alunos;

DROP TABLE IF EXISTS alunos_pendentes;

--tabela para alunos que ainda não tiveram cadastro aprovado pela coordenação
CREATE TABLE IF NOT EXISTS alunos_pendentes(
	id SERIAL NOT NULL,
	nome VARCHAR(50) NOT NULL,
	email VARCHAR(50) NOT NULL,
	senha VARCHAR(50) NOT NULL,
	matricula VARCHAR(50) NOT NULL,
	curso VARCHAR(100) NOT NULL,
	usertoken VARCHAR(100) NOT NULL,
	ativo BOOLEAN NOT NULL DEFAULT TRUE,
	data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id)
);

INSERT INTO alunos_pendentes (nome,email,senha,matricula,curso,usertoken) VALUES ('Felipe','felipe@gmail.com','lollol',412649,'engenharia',123);
SELECT * FROM alunos_pendentes;