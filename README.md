# server-sistema-ldc

#Configurando o servidor com PM2:

1:  npm install pm2 -g
2:  pm2 start ./index.js --name serverLDC


#Utilitarios:

pm2 ls: para listar os processos existentes;
pm2 restart myApp: para reiniciar o processo myApp;
pm2 stop myApp: para derrubar o processo myApp;
pm2 delete myApp: para excluir o processo myApp;
pm2 logs –lines 100: para exibir as últimas 100 linhas de logs dos processos;
