const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt =    require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');

const User = require('../modals/User');

router.post('/',[
    check('name','name is required').not().isEmpty(),
    check('email','not a valid email ').isEmail(),
    check('password','enter a password with atleast 6 charatcter').isLength({
        min: 6
    })
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});        
    } 
    const {name, email, password} = req.body;

    try {
        let user = await User.findOne({emai:email});
        if(user){
            return res.status(400).json({msg:'user already exist'});
        }
        user = new User({
            name:name,
            email:email,
            password:password
        });
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id,
            }
        }

        jwt.sign(payload, config.get('jwtSecret'), {
            expiresIn:3600,
        },(err, token ) => {
            if(err) throw err;
            res.json({token});
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
 }
);
module.exports = router;