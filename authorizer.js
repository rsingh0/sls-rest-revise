const { CognitoJwtVerifier } = require("aws-jwt-verify")
const COGNITO_USERPOOL_ID = process.env.COGNITO_USERPOOL_ID;
const COGNITO_WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID

const jwtVerifier = CognitoJwtVerifier.create({
    userPoolId: 'us-east-1_0EgcoFx5I',
    tokenUse: 'id',
    clientId: '863nba0mtfd83cbsluedf1a8c',
})

  // Returns an IAM Policy
  // principalId can ab any string
  // effect - "allow" or "deny"
  // resource - arn of api endpoint
  const generatePolicy = (principalId, effect, resource) => {
    const authResponse = { principalId };
    if (effect && resource) {
        // Any standard IAM Policy
      const policyDocument = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: effect,
            Resource: resource,
            Action: "execute-api:Invoke", // Executing invokation of API endpoint
          },
        ],
      };
      authResponse.policyDocument = policyDocument;
    }
    authResponse.context = {
      foo: "bar",
    };
    console.log(JSON.stringify(authResponse));
    return authResponse;
  };

  // Cognito User Authentication
module.exports.authorize = async (event, context, callback) => {

  // This will fetch token from "authorization" posted from postman/client
  const token = event.authorizationToken; //"allow" or "deny"
  console.log('token', token);
  try {
    const payload = await jwtVerifier.verify(token)
    console.log(JSON.stringify(payload));
    callback(null, generatePolicy("user", "Allow", event.methodArn));
  } catch (error) {
    callback("Error: Invalid token");
  }
};

// Basic Lamda authirizer
// module.exports.authorize = async (event, context, callback) => {

//   // This will fetch token from "authorization" posted from postman/client
//   const token = event.authorizationToken; //"allow" or "deny"
//   console.log('toke', token);
//   switch (token) {
//     case "allow":
//       callback(null, generatePolicy("user", "Allow", event.methodArn));
//       break;
//     case "deny":
//         callback(null, generatePolicy("user", "Deny", event.methodArn));
//     default:
//         callback("Error: Invalid token");
//   }
// };
