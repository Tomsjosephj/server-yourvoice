const express = require('express')

const app = express()

const Mailgen = require('mailgen');

const nodemailer = require("nodemailer");

const cors = require('cors')
const { default: mongoose } = require('mongoose')

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))


const cookieparser = require('cookie-parser')

const { EMAIL, PASSWORD } = require('./env')

app.use(express.json())

const bcrypt = require('bcrypt')

const salt = bcrypt.genSaltSync(10)

const secretkey = "sffwgrfegjrwvurvdfisv"

const multer = require('multer')
const uploadmiddleware = multer({ dest: 'uploads/' })

const jwt = require('jsonwebtoken')

app.use(cookieparser())



const fs = require('fs')




app.listen(4000)


mongoose.connect('mongodb+srv://tomsjosephpjohny:YHtkVqq9B6N9nkKp@cluster0.tlxco5s.mongodb.net/?retryWrites=true&w=majority')


const users = require('./Models/user')

const posts = require('./Models/post')
//const { log } = require('console')


app.use("/uploads", express.static("./uploads"))

app.get('/test', (req, res) => {
    res.json("Server started")
})


app.post("/register", async (req, res) => {

    const { username, password, email } = req.body

    try {
        const userdoc = await users.create({
            username,
            password: bcrypt.hashSync(password, salt),
            email
        })


        // Email senting
        if (userdoc) {

            let config = {
                service: 'gmail',
                auth: {
                    user: EMAIL,
                    pass: PASSWORD
                }
            }
            //let testAccount = await nodemailer.createTestAccount();

            let transporter = nodemailer.createTransport(config)

            let mailGenerator = new Mailgen({
                theme: 'default',
                product: {
                    // Appears in header & footer of e-mails
                    name: 'Admin',
                    link: 'https://mailgen.js/'
                    // Optional product logo
                    // logo: 'https://mailgen.js/img/logo.png'
                }
            });


            let response = {
                body: {
                    name: userdoc.username,
                    intro: 'Registered sussesfully',
                    table: {
                        data: [
                            {
                                Message: `Your account is succesfully registered.`,
                                username: `${userdoc.username}`


                            }
                        ]
                    },
                    outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
                }
            }

            let emailBody = mailGenerator.generate(response)

            let message = {
                from: EMAIL, // sender address
                to: userdoc.email, // list of receivers
                subject: "Registered succesfully", // Subject line
                text: `Succesfully registered with us. Your username is ${userdoc.username}`, // plain text body
                html: emailBody // html body
            }

            transporter.sendMail(message).then(() => {
                res.json({
                    userdoc,
                    Message: "you will receive an email"
                })
            }).catch(error => {
                res.status(405).json(error)
            })


        }



    }
    catch (error) {
        res.status(400).json(error)
    }


})


//login section
app.post("/login", async (req, res) => {

    const { username, password } = req.body;

    const userdoc = await users.findOne({ username });


    console.log(userdoc);

    const passok = userdoc && bcrypt.compareSync(password, userdoc.password)

    // console.log(passok);

    if (passok) {
        //login succesfull

        jwt.sign({ username, id: userdoc._id }, secretkey, {}, (err, token) => {

            if (err) throw err

            res.cookie('token', token).json({
                id: userdoc._id,
                username
            })


        })


    }
    else {
        res.status(402).json("Invalid User Inputs")
    }



})

app.get('/profile', (req, res) => {

    const { token } = req.cookies

    jwt.verify(token, secretkey, {}, (err, info) => {

        if (err) throw err;
        res.json(info)
    })

    console.log(req.cookies);

    //  res.json(req.cookies)

})


app.post("/logout", (req, res) => {

    res.cookie('token', '').json("Token empty")
})

app.post("/post", uploadmiddleware.single("file"), async (req, res) => {

    const { originalname, path } = req.file

    const parts = originalname.split('.')

    const extension = parts[parts.length - 1]

    const newpath = path + '.' + extension

    fs.renameSync(path, newpath)

    const { token } = req.cookies

    jwt.verify(token, secretkey, {}, async (err, info) => {

        if (err) throw err;
        const { title, summary, content } = req.body
        const postdoc = await posts.create({
            title,
            summary,
            content,
            image: newpath,
            author: info.id
        })
        res.json(postdoc)
    })


})

app.get('/allposts', async (req, res) => {

    const allblogs = await posts.find().populate('author', ['username']).sort({ createdAt: '-1' })

    res.json(allblogs)
})


//to get a single post

app.get('/view/:id', async (req, res) => {
    const { id } = req.params

    const singlepage = await posts.findById(id).populate('author', ['username'])

    res.json(singlepage)

})


app.put('/edit', uploadmiddleware.single("file"), async (req, res) => {

    let newpath = null
    if (req.file) {

        const { originalname, path } = req.file

        const parts = originalname.split('.')

        const extension = parts[parts.length - 1]

        newpath = path + '.' + extension

        fs.renameSync(path, newpath)
    }

    const { token } = req.cookies

    jwt.verify(token, secretkey, {}, async (err, info) => {

        if (err) throw err;
        const { title, summary, content, id } = req.body

        const postdoc = await posts.findById(id)

        const isauthor = JSON.stringify(postdoc.author) === JSON.stringify(info.id)

        if (isauthor) {
            await postdoc.updateOne({
                title,
                summary,
                content,
                image: newpath ? newpath : postdoc.image
            })
        }

        res.json(postdoc)


    })




})

app.delete('/deletepost/:id', async (req, res) => {
    const { token } = req.cookies

    jwt.verify(token, secretkey, {}, async (err, info) => {
        if (err) throw err;
        const { id } = req.params
        const postdoc = await posts.findById(id)

        const isauthor = JSON.stringify(postdoc.author) === JSON.stringify(info.id)

        console.log(isauthor);

        if (isauthor) {
            await posts.findByIdAndDelete(id)
        }

        res.json("Item deleted")
    }
    )





})
//YHtkVqq9B6N9nkKp

//mongodb+srv://tomsjosephpjohny:YHtkVqq9B6N9nkKp@cluster0.tlxco5s.mongodb.net/?retryWrites=true&w=majority






//*****************/

