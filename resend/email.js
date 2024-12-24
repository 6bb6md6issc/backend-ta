import resend from './config.js';
import { verificationEmailTemplate, welcomeEmailTemplate } from './email-template.js';

export const sendVerificationEmail = async (email, verificationToken) => {
    try{
        const { data, error } = await resend.emails.send({
            from: "Acme <onboarding@resend.dev>",
            to: [email],
            subject: "Verify your email",
            html: verificationEmailTemplate.replace('{verificationToken}', verificationToken),
            });
    } catch(error){
        console.log("error with sending verification email", error);
        throw new Error("error with sending verification email");
    }
};

export const sendWelcomeEmail = async (email, name) => {
    try{
        const { data, error } = await resend.emails.send({
            from: "Acme <onboarding@resend.dev>",
            to: [email],
            subject: "Welcome to Teacher Assistant Application System",
            html: welcomeEmailTemplate.replace('{name}', name),
            });
    } catch(error){
        console.log("error with sending welcome email", error);
        throw new Error("error with sending welcome email");
    }
}

export const sendPasswordResetEmail = async (email, resetURL) => {
    try{
        const { data, error } = await resend.emails.send({
            from: "Acme <onboarding@resend.dev>",
            to: [email],
            subject: "Reset Your Password",
            html: `Click <a href="${resetURL}">here</a> to reset your password`,
        });
    } catch(error){
        console.log("error with sending reset password email", error);
        throw new Error("error with sending reset password email");
    }
};

export const sendResetSucessEmail = async (email) => {
    try{
        const { data, error } = await resend.emails.send({
            from: "Acme <onboarding@resend.dev>",
            to: [email],
            subject: "Reset Your Password",
            html: `Your password has been reset successfully`,
        });
    } catch(error){
        console.log("error with sending reset success confirmation email", error);
        throw new Error("error with sending reset success confirmation email");
    }
};