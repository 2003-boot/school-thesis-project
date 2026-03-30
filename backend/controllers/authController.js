import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};


export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error:
          userExists.email === email
            ? "Email already registered"
            : "Username already taken",
        statusCode: 400,
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      username,
      email,
      password,
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendEmail({
      to: user.email,
      subject: "Vérification de votre adresse email",
      text: `Votre code de vérification est : ${verificationCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Vérification de votre email</h2>
          <p>Bonjour ${user.username},</p>
          <p>Votre code de vérification est :</p>
          <h1 style="letter-spacing: 4px;">${verificationCode}</h1>
          <p>Ce code expire dans 10 minutes.</p>
        </div>
      `,
    });

    res.status(201).json({
      success: true,
      data: {
        email: user.email,
      },
      message: "Compte créé. Veuillez vérifier votre adresse email.",
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide email and password",
        statusCode: 400,
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        statusCode: 401,
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
        statusCode: 401,
      });
    }
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: "Please verify your email before logging in",
        statusCode: 403
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
      token,
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { username, email, profileImage } = req.body;

    const user = await User.findById(req.user._id);

    if (username) user.username = username;
    if (email) user.email = email;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const changePassword = async (req, res, next) => {
  try {
     const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Please provide current and new password",
        statusCode: 400,
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
        statusCode: 401,
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: "Please provide email and verification code",
        statusCode: 400,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        statusCode: 404,
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: "Email already verified",
        statusCode: 400,
      });
    }

    if (
      user.emailVerificationCode !== code ||
      !user.emailVerificationCodeExpires ||
      user.emailVerificationCodeExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification code",
        statusCode: 400,
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationCodeExpires = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Please provide email",
        statusCode: 400,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        statusCode: 404,
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: "Email already verified",
        statusCode: 400,
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailVerificationCode = verificationCode;
    user.emailVerificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Nouveau code de vérification",
      text: `Votre nouveau code de vérification est : ${verificationCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Nouveau code de vérification</h2>
          <p>Bonjour ${user.username},</p>
          <p>Votre nouveau code de vérification est :</p>
          <h1 style="letter-spacing: 4px;">${verificationCode}</h1>
          <p>Ce code expire dans 10 minutes.</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Please provide email",
        statusCode: 400,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        statusCode: 404,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Réinitialisation du mot de passe",
      text: `Bonjour ${user.username},

    Vous avez demandé la réinitialisation de votre mot de passe.

    Cliquez sur ce lien pour définir un nouveau mot de passe :
    ${resetUrl}

    Ce lien expire dans 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Réinitialisation du mot de passe</h2>
          <p>Bonjour ${user.username},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
          <a 
            href="${resetUrl}" 
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            "
          >
            Réinitialiser mon mot de passe
          </a>
          <p style="margin-top: 20px;">Ou copiez ce lien dans votre navigateur :</p>
          <p>${resetUrl}</p>
          <p>Ce lien expire dans 15 minutes.</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Password reset instructions sent successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Please provide token and new password",
        statusCode: 400,
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
        statusCode: 400,
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: new Date() }
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
        statusCode: 400,
      });
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};