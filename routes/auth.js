const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt =    require('jsonwebtoken');
const config = require('config');
const auth = require('../middelware/auth'); 
const {check, validationResult} = require('express-validator');

const User = require('../modals/User');

router.get('/', auth, async (req,res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);  
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/',[
    check('email', 'please add valid email'),isEmail(),
    check('password','password required').exists()
],
async  (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});        
    } 
    
    const {email, password } = req.body; 

    try {
        let user = await User.findOne({ email });

        if(!user){
            return res.status(400).json({msg: 'Invalid credentials '});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({msg:'Invaliid credentials'});
        }

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
       console.log(err.message);
       res.status(5000).send('Server Error') 
    }
}
);

module.exports = router;