import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const router = Router();
const HOST_GENDERS = ["M", "F", "Other"];
const HOST_SIZES = ["XS", "S", "M", "L", "XL"];

const validateHostSignup = (body = {}) => {
  const errors = [];
  const requiredFields = [
    { key: "fName", label: "First name" },
    { key: "lName", label: "Last name" },
    { key: "email", label: "Email" },
    { key: "password", label: "Password" },
    { key: "phoneNb", label: "Phone number" },
    { key: "age", label: "Age" },
    { key: "gender", label: "Gender" },
    { key: "address", label: "Address" },
    { key: "clothingSize", label: "Clothing size" },
  ];

  requiredFields.forEach(({ key, label }) => {
    if (body[key] === undefined || body[key] === null || String(body[key]).trim() === "") {
      errors.push(`${label} is required.`);
    }
  });

  if (body.password && String(body.password).length < 6) {
    errors.push("Password must be at least 6 characters.");
  }

  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email).trim())) {
    errors.push("Valid email is required.");
  }

  if (body.age !== undefined) {
    const ageValue = Number(body.age);
    if (Number.isNaN(ageValue) || ageValue < 18 || ageValue > 100) {
      errors.push("Age must be between 18 and 100.");
    }
  }

  if (body.gender && !HOST_GENDERS.includes(String(body.gender).trim())) {
    errors.push("Gender must be M, F, or Other.");
  }

  if (body.clothingSize && !HOST_SIZES.includes(String(body.clothingSize).trim())) {
    errors.push("Clothing size must be one of XS, S, M, L, XL.");
  }

  return errors;
};

const validateClientSignup = (body = {}) => {
  const errors = [];
  const requiredFields = [
    { key: "fName", label: "First name" },
    { key: "lName", label: "Last name" },
    { key: "email", label: "Email" },
    { key: "password", label: "Password" },
    { key: "phoneNb", label: "Phone number" },
    { key: "age", label: "Age" },
    { key: "gender", label: "Gender" },
    { key: "address", label: "Address" },
  ];

  requiredFields.forEach(({ key, label }) => {
    if (body[key] === undefined || body[key] === null || String(body[key]).trim() === "") {
      errors.push(`${label} is required.`);
    }
  });

  if (body.password && String(body.password).length < 6) {
    errors.push("Password must be at least 6 characters.");
  }

  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email).trim())) {
    errors.push("Valid email is required.");
  }

  if (body.age !== undefined) {
    const ageValue = Number(body.age);
    if (Number.isNaN(ageValue) || ageValue < 18 || ageValue > 80) {
      errors.push("Age must be between 18 and 80.");
    }
  }

  if (body.gender && !HOST_GENDERS.includes(String(body.gender).trim())) {
    errors.push("Gender must be M, F, or Other.");
  }

  return errors;
};

router.post("/login", async (req, res) => {
  const email = req.body.email?.trim();
  const password = req.body.password;
  const role = req.body.role;
  const validationErrors = [];

  if (!email) {
    validationErrors.push("Email is required.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    validationErrors.push("Valid email is required.");
  }
  if (!password) {
    validationErrors.push("Password is required.");
  }
  if (!role || !["user", "admin", "client"].includes(role)) {
    validationErrors.push("Valid role is required.");
  }

  if (validationErrors.length) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validationErrors,
    });
  }

  try {
    let table, idField;
    if (role === 'user') { table = 'USERS'; idField = 'userId'; }
    else if (role === 'admin') { table = 'ADMINS'; idField = 'adminId'; }
    else if (role === 'client') { table = 'CLIENTS'; idField = 'clientId'; }
    else return res.status(400).json({ message: 'Invalid role' });

    const [rows] = await db.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const user = rows[0];
    const validPass = await bcrypt.compare(password, user.password);
    // ONLY FOR TESTING PURPOSES
    // const validPass = password === user.password; // Temporary for testing

    if (!validPass) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user[idField], role }, process.env.JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post("/signup/host", async (req, res) => {
  const errors = validateHostSignup(req.body);
  if (errors.length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const {
    fName,
    lName,
    email,
    password,
    phoneNb,
    age,
    gender,
    address,
    clothingSize,
    profilePic,
    description,
  } = req.body;

  try {
    const [existing] = await db.query("SELECT userId FROM USERS WHERE email = ?", [email.trim()]);
    if (existing.length) {
      return res.status(409).json({ message: "Email already exists.", field: "email" });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const normalizedDescription = description?.trim();

    const [result] = await db.query(
      `INSERT INTO USERS
        (fName, lName, email, password, phoneNb, age, gender, address, clothingSize, profilePic, description, eligibility, isActive, codeOfConductAccepted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0)`,
      [
        fName.trim(),
        lName.trim(),
        email.trim(),
        hashedPass,
        phoneNb.trim(),
        Number(age),
        gender.trim(),
        address.trim(),
        clothingSize.trim(),
        profilePic?.trim() || null,
        normalizedDescription === undefined ? "" : normalizedDescription,
      ]
    );

    const [rows] = await db.query(
      `SELECT userId, fName, lName, email, phoneNb, age, gender, address, clothingSize,
              profilePic, description, eligibility, isActive, codeOfConductAccepted, createdAt, updatedAt
         FROM USERS
        WHERE userId = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Host registered successfully.",
      user: rows[0],
    });
  } catch (err) {
    console.error("Failed to register host", err);
    res.status(500).json({ message: "Failed to register host." });
  }
});

router.post("/signup/client", async (req, res) => {
  const errors = validateClientSignup(req.body);
  if (errors.length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const { fName, lName, email, password, phoneNb, age, gender, address } = req.body;

  try {
    const [existing] = await db.query("SELECT clientId FROM CLIENTS WHERE email = ?", [email.trim()]);
    if (existing.length) {
      return res.status(409).json({ message: "Email already exists.", field: "email" });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO CLIENTS
        (fName, lName, email, password, phoneNb, age, gender, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fName.trim(),
        lName.trim(),
        email.trim(),
        hashedPass,
        phoneNb.trim(),
        Number(age),
        gender.trim(),
        address.trim(),
      ]
    );

    res.status(201).json({
      message: "Client registered successfully.",
      client: {
        clientId: result.insertId,
        fName: fName.trim(),
        lName: lName.trim(),
        email: email.trim(),
        phoneNb: phoneNb.trim(),
        age: Number(age),
        gender: gender.trim(),
        address: address.trim(),
      },
    });
  } catch (err) {
    console.error("Failed to register client", err);
    res.status(500).json({ message: "Failed to register client." });
  }
});

export default router;
