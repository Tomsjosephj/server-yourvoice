const mongoose= require('mongoose')              


const postschema= new mongoose.Schema({
    title:String,
    summary:String,
    content:String,
    image:String,
    author:{type:mongoose.Schema.Types.ObjectId, ref:'users'}

},{
    timestamps:true
})

const postmodel= mongoose.model('posts',postschema)

module.exports=postmodel                                                                    