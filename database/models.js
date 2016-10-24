module.exports = { 
	user:{ 
		name:{type:String,required:true},
		password:{type:String,required:true}
    },
    file: {
        name: { type: String, required: true },
        filename: { type: String, required: true },
        pathname: { type: String, required: true }
    }
};