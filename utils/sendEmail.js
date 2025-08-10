const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

const sendEmail = async ({ to, subject, text, html }) => {
    try{
    const mailOptions = ({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
    })

    const email = await  transporter.sendMail(mailOptions);
    return email;
}catch(error){
    console.log(`Failed to send email: ${error}`)
    throw new Error(`Failed to send email`)
}
}


module.exports = sendEmail;