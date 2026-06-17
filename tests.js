import http from 'k6/http';
import { check } from 'k6';

export let options = {
    vus: 1000,
    duration: '5s',
};

 export default function () {

    const payload = JSON.stringify({
    userCode : 'class Solution {public int add(int a, int b){return a + b;}}',
    questionId : 2,
    userId : 6
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiVVNFUiIsInVzZXJJZCI6NiwiZW1haWwiOiJoZWNrZXJlaGVAZ21haWwuY29tIiwidXNlcm5hbWUiOiJoZWl4eCIsInN1YiI6ImhlY2tlcmVoZUBnbWFpbC5jb20iLCJpYXQiOjE3ODE2Nzg4MDYsImV4cCI6MTc4MTc2NTIwNn0.ZqL1Lq-sBkZP93j2g2APFPzlYZZfVs1i_WH7mUGo474',
        },
    };

    const res = http.post('http://localhost:8080/api/submit/java', payload, params);

    check(res, {
        'is status 200': (r) => r.status === 200,
    });
} 

    /* export default function () {
        const res = http.get('http://localhost:8080/api/ping');
        check(res, {
            'is status 200': (r) => r.status === 200,
        });
    }*/