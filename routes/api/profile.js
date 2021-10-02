const express = require('express');
const router = express.Router();
const verify = require('../../middleware/verify')
const ProfileSchema = require('../../models/ProfileSchema');
const UserSchema = require('../../models/UserSchema');
const { check, validationResult } = require('express-validator');



// @route  GET api/profile/myprofile
// @desc   GET current user's profile
// @access Private

router.get('/myprofile', verify, async (req, res) => {
    try {
        const profile = await ProfileSchema.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Profile Auth Error')
    }
});

// @route  GET api/profile
// @desc   Create OR Update user profile
// @access Private
router.post(
    '/', 
    [verify, [
        check('status', 'Status is required').not().isEmpty(),
        check('skills', 'Skill is required').not().isEmpty()
    ]],
    // (res, res) 함수 이후에는 => 화살표, 그리고 오브젝트를 열어준다.
    async (req, res) => {
        const errors = validationResult(req);
        // if () {} 방식으로, if 함수 뒤에는 중괄호를 열어 에러를 return 한다. 
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        // Build Profile Object
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }

        // 오브젝트 안에 오브젝트를 call 하려면 outerobject.innerobject 하면 된다. 
        // i.e. console.log(profileFields.skills);
        // Build Social Object, to define it as profile object, we need to define innerobject as well
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (instagram) profileFields.social.instagram = instagram;
        if (linkedin) profileFields.social.linkedin = linkedin;

        try {
            let profile = await ProfileSchema.findOne({ user: req.user.id });

            if(profile) {
                // Update
                profile = await ProfileSchema.findOneAndUpdate(
                    { user: req.user.id }, 
                    { $set: profileFields}, 
                    { new: true }
                );

                return res.json(profile);
            }
            
            // Create
            profile = new ProfileSchema(profileFields);
            await profile.save();
            res.json(profile);
        } catch(err) {
            console.error(err.message);
            res.status(500).send('Profile Build/Update Server Error');
        }
    }
);

module.exports = router;