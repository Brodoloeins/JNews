//Const de base
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const session = require('express-session')
const fileUpload = require('express-fileupload')
const fs = require('fs')

//Express
const app = express()

const Posts = require('./posts.js')

//Mongoose
mongoose.connect('Sua URL',{useNewUrlParser: true, useUnifiedTopology: true}).then(function(){
    console.log('Conectado com sucesso')
}).catch(function(err){
    console.log(err.message)
})

//Definições para os arquivos e outras settings
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended:true
}))
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true, 
    cookie: { maxAge: 60000 }
}))
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'temp')
}))

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')
app.use('/public', express.static(path.join(__dirname,'public')))
app.set('views', path.join(__dirname, '/pages'))

//Variáveis
//Routes
app.get('/', (req,res)=>{
    console.log(req.query)

    if(req.query.busca == null){
        Posts.find({}).sort({'_id': -1}).exec(function(err, posts){
            posts = posts.map(function(val){
                return{
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0, 100),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria,
                }
            })
            Posts.find({}).sort({'views': -1}).limit(3).exec(function(err,postsTop){
                 postsTop = postsTop.map(function(val){
                    return {
                            titulo: val.titulo,
                            conteudo: val.conteudo,
                            descricaoCurta: val.conteudo.substr(0,100),
                            imagem: val.imagem,
                            slug: val.slug,
                            categoria: val.categoria,
                            views: val.views 
                    }
                 })
                 res.render('home',{posts:posts,postsTop:postsTop});
            })
        })
    }else{
        Posts.find({titulo: {$regex: req.query.busca, $options: "i"}}, function(err, posts){
            posts = posts.map(function(val){
                return{
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0, 200),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria,
                }
            })
            res.render('busca',{posts: posts, contagem:posts.length})
        })
    }
})

app.get('/:slug',(req,res)=>{
    Posts.findOneAndUpdate({slug:req.params.slug}, {$inc : {views: 1}}, {new: true}, function(err, resposta){
        if( resposta != null){
            Posts.find({}).sort({'views': -1}).limit(3).exec(function(err,postsTop){
                postsTop = postsTop.map(function(val){
                    return {
                        titulo: val.titulo,
                        conteudo: val.conteudo,
                        descricaoCurta: val.conteudo.substr(0,100),
                        imagem: val.imagem,
                        slug: val.slug,
                        categoria: val.categoria,
                        views: val.views 
                    }
                })
                res.render('single',{noticia: resposta, postsTop: postsTop})
            })
        }else{
            res.redirect('/')
        }
    })
})

var usuarios = [
    {
        login: "João",
        senha: "senha"
    }
]

app.post('/admin/login', (req,res)=>{
    usuarios.map((val)=>{
        if(val.login == req.body.login && val.senha == req.body.senha){
            req.session.login = val.login;
        }
    })
    res.redirect('/admin/login')
})

app.post('/admin/cadastro', (req,res)=>{

    let formato = req.files.arquivo.name.split('.')
    var imagem = " ";

    if(formato[formato.length - 1] == 'jpg'){
        imagem = new Date().getTime()+'.jpg'
        req.files.arquivo.mv(__dirname+"/public/imgs/"+imagem)
    }else{
        fs.unlinkSync(req.files.arquivo.tempFilePath)
    }

    Posts.create({
        titulo: req.body.titulo_noticia,
        imagem: "http://localhost:5000/public/imgs/"+imagem,
        categoria: 'Nenhuma',
        conteudo: req.body.noticia,
        slug: req.body.slug,
        autor: req.session.login,
        views: 0
    })
    res.redirect('/admin/login')
})

app.get('/admin/deletar/:id', (req,res)=>{
    Posts.deleteOne({_id: req.params.id}).then(function(){
        res.redirect('/admin/login');
    })
})

app.get('/admin/login', (req,res)=>{
    if(req.session.login == null){
        res.render('admin-login')
    }else{
        Posts.find({}).sort({'_id': -1}).exec(function(err, posts){
            posts = posts.map(function(val){
                return{
                    _id: val.id,
                    titulo: val.titulo,
                    conteudo: val.conteudo,
                    descricaoCurta: val.conteudo.substr(0, 100),
                    imagem: val.imagem,
                    slug: val.slug,
                    categoria: val.categoria,
                }
            })
            res.render('admin-panel', {posts: posts})
        })
    }
})

//Porta do servidor
app.listen(5000, ()=>{
    console.log('Server Rodando')
})