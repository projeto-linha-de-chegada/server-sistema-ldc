var Service = require('node-windows').Service;
// Criando um novo objeto do Serviço
var svc = new Service({
//Nome do servico
name:'server-ldc',
//Descricao que vai aparecer no Gerenciamento de serviço do Windows
description: 'Servidor do sistema LDC',
//caminho absoluto do seu script
//script: 'C:\\tutorial\\app.js'
script: 'C:\\Users\\felipe\\projetos\\javascript\\projeto-ldc\\server-ldc\\index.js'
});
svc.on('install',function(){
svc.start();
});
// instalando o servico
svc.install();