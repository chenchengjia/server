var fileFolder = "/public/files/";

module.exports = {

	//File Upload Settings:
	filefolder 		: fileFolder,
	uploadDir  		: process.cwd() + fileFolder,
	multerDir       : '.' + fileFolder
};