const fs = require('fs');

let controller = fs.readFileSync('controllers/adminController.js', 'utf-8');
const newFunc = \
// Register Admin
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all details" });
    }

    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin'
    });

    const admin = await newAdmin.save();
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ success: true, token, message: "Admin created successfully" });
  } catch (error) {
    console.error('[ADMIN REG] Error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { loginAdmin, registerAdmin };
\;
controller = controller.replace('module.exports = { loginAdmin };', newFunc);
fs.writeFileSync('controllers/adminController.js', controller);

let route = fs.readFileSync('routes/adminRoute.js', 'utf-8');
route = route.replace("const { loginAdmin } = require('../controllers/adminController');", "const { loginAdmin, registerAdmin } = require('../controllers/adminController');");
route = route.replace("router.post('/login', loginAdmin);", "router.post('/login', loginAdmin);\nrouter.post('/register', registerAdmin);");
fs.writeFileSync('routes/adminRoute.js', route);
