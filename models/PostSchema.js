// Schema, 많은 라우트 작업에 기초가 되며, 어떤 요소들이 들어가는지 정의하는 자바스크립트 파일. ex) 포스트에 필요한 요소들 정의, mongoose를 사용하여 DB와 상호작용하며
// 라우트에서도 활용할 예정임. 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    text: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    avatar: {
        type: String
    },
    // [] 대괄호는 array이다. 
    likes: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'user'
            }
        }
    ],
    comments: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'user'
            },
            text: {
                type: String,
                required: true
            },
            name: {
                type: String
            },
            avatar: {
                type: String
            },
            date: {
                type: Date,
                default: Date.now 
            }
        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
});