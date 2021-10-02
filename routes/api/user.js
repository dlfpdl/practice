const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../../models/UserSchema');

// @route  GET api/user
// @desc   Register Route
// @access Public

router.post('/', [
    check('name', 'Name is required')
        .not()
        .isEmpty(),
    check('email', 'please include a vaild email').isEmail(),
    check(
        'password', 'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
], 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        // See if user exists
        if(user) {
            res.status(400).json({ errors: [{ msg: 'User already exists'}] });
        }

        // Get user's gravatar
        const avatar = gravatar.url(email, {
            // size
            s: '200',
            // rating
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        })

        // Encrypt password
        const salt = await bcrypt.genSalt(10);

        // Taking the password from the upper user
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
            // Callback
            if(err) throw err;
            res.json({ token });
        });

    } catch(err) {
        console.error(err.message);
        res.status(500).send('User Registration Error');
    }
});

module.exports = router;