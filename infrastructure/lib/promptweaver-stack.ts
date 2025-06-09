import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';

export class PromptWeaverStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const promptsTable = new dynamodb.Table(this, 'PromptWeaverPrompts', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
    });

    const agentsTable = new dynamodb.Table(this, 'PromptWeaverAgents', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
    });

    // Add GSI for querying agents by promptId
    agentsTable.addGlobalSecondaryIndex({
      indexName: 'promptId-index',
      partitionKey: { name: 'promptId', type: dynamodb.AttributeType.STRING },
    });

    const versionsTable = new dynamodb.Table(this, 'PromptWeaverVersions', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
    });

    // Add GSI for querying versions by agentId
    versionsTable.addGlobalSecondaryIndex({
      indexName: 'agentId-index',
      partitionKey: { name: 'agentId', type: dynamodb.AttributeType.STRING },
    });

    const usersTable = new dynamodb.Table(this, 'PromptWeaverUsers', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
    });

    // Cognito User Pool with LinkedIn URL custom attribute
    const userPool = new cognito.UserPool(this, 'PromptWeaverUserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        'linkedin_url': new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
    });

    // Pre-signup Lambda to validate LinkedIn URL
    const preSignupHandler = new lambda.Function(this, 'PreSignupHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'cognitoPreSignup.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src/utils')),
    });

    // Add the Lambda as a pre-signup trigger
    userPool.addTrigger(cognito.UserPoolOperation.PRE_SIGN_UP, preSignupHandler);

    // Google Identity Provider
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
      userPool,
      clientId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
      scopes: ['profile', 'email', 'openid'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
        profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
      },
    });

    // User Pool Client for frontend with social providers
    const userPoolClient = new cognito.UserPoolClient(this, 'PromptWeaverUserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          'http://localhost:3000/auth/callback',
          'https://promptweaver.example.com/auth/callback', // Replace with your domain
        ],
        logoutUrls: [
          'http://localhost:3000/',
          'https://promptweaver.example.com/', // Replace with your domain
        ],
      },
    });
    
    // Make sure the identity providers are created before the client
    userPoolClient.node.addDependency(googleProvider);

    // IAM Role for Lambda functions
    const lambdaRole = new iam.Role(this, 'PromptWeaverLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Add permissions for DynamoDB
    promptsTable.grantReadWriteData(lambdaRole);
    agentsTable.grantReadWriteData(lambdaRole);
    versionsTable.grantReadWriteData(lambdaRole);
    usersTable.grantReadWriteData(lambdaRole);

    // Add permissions for Bedrock
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
      ],
      resources: ['*'], // Scope this down in production
    }));

    // Lambda Functions
    const promptHandler = new lambda.Function(this, 'PromptHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'promptHandler.submitPrompt',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src/handlers')),
      environment: {
        PROMPTS_TABLE: promptsTable.tableName,
        AGENTS_TABLE: agentsTable.tableName,
        VERSIONS_TABLE: versionsTable.tableName,
        USERS_TABLE: usersTable.tableName,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
    });

    const getPromptHandler = new lambda.Function(this, 'GetPromptHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'promptHandler.getPrompt',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src/handlers')),
      environment: {
        PROMPTS_TABLE: promptsTable.tableName,
        AGENTS_TABLE: agentsTable.tableName,
      },
      role: lambdaRole,
    });

    const getPublicPromptsHandler = new lambda.Function(this, 'GetPublicPromptsHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'promptHandler.getPublicPrompts',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src/handlers')),
      environment: {
        PROMPTS_TABLE: promptsTable.tableName,
      },
      role: lambdaRole,
    });

    const searchPromptsHandler = new lambda.Function(this, 'SearchPromptsHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'promptHandler.searchPrompts',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src/handlers')),
      environment: {
        PROMPTS_TABLE: promptsTable.tableName,
      },
      role: lambdaRole,
    });

    const forkPromptHandler = new lambda.Function(this, 'ForkPromptHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'promptHandler.forkPrompt',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src/handlers')),
      environment: {
        PROMPTS_TABLE: promptsTable.tableName,
        AGENTS_TABLE: agentsTable.tableName,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
    });

    const getAgentHandler = new lambda.Function(this, 'GetAgentHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'agentHandler.getAgent',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src/handlers')),
      environment: {
        AGENTS_TABLE: agentsTable.tableName,
      },
      role: lambdaRole,
    });

    const updateAgentHandler = new lambda.Function(this, 'UpdateAgentHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'agentHandler.updateAgent',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src/handlers')),
      environment: {
        AGENTS_TABLE: agentsTable.tableName,
        VERSIONS_TABLE: versionsTable.tableName,
      },
      role: lambdaRole,
    });

    const getAgentVersionsHandler = new lambda.Function(this, 'GetAgentVersionsHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'agentHandler.getAgentVersions',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/src/handlers')),
      environment: {
        VERSIONS_TABLE: versionsTable.tableName,
      },
      role: lambdaRole,
    });

    // API Gateway with Cognito Authorizer
    const api = new apigateway.RestApi(this, 'PromptWeaverApi', {
      restApiName: 'PromptWeaver API',
      description: 'API for PromptWeaver application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'PromptWeaverAuthorizer', {
      cognitoUserPools: [userPool],
    });

    const authorizerProps = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // API Routes
    const prompts = api.root.addResource('prompts');
    
    // POST /prompts - Submit a raw prompt
    prompts.addMethod('POST', new apigateway.LambdaIntegration(promptHandler), authorizerProps);
    
    // GET /prompts/public - Get public prompts
    const publicPrompts = prompts.addResource('public');
    publicPrompts.addMethod('GET', new apigateway.LambdaIntegration(getPublicPromptsHandler));
    
    // GET /prompts/search - Search prompts
    const searchPrompts = prompts.addResource('search');
    searchPrompts.addMethod('GET', new apigateway.LambdaIntegration(searchPromptsHandler));
    
    // GET /prompts/{id} - Get a prompt by ID
    const promptById = prompts.addResource('{id}');
    promptById.addMethod('GET', new apigateway.LambdaIntegration(getPromptHandler), authorizerProps);
    
    // POST /prompts/{id}/fork - Fork a prompt
    const forkPrompt = promptById.addResource('fork');
    forkPrompt.addMethod('POST', new apigateway.LambdaIntegration(forkPromptHandler), authorizerProps);
    
    // Agents routes
    const agents = api.root.addResource('agents');
    
    // GET /agents/{id} - Get an agent by ID
    const agentById = agents.addResource('{id}');
    agentById.addMethod('GET', new apigateway.LambdaIntegration(getAgentHandler), authorizerProps);
    
    // PUT /agents/{id} - Update an agent (create new version)
    agentById.addMethod('PUT', new apigateway.LambdaIntegration(updateAgentHandler), authorizerProps);
    
    // GET /agents/{id}/versions - Get version history for an agent
    const agentVersions = agentById.addResource('versions');
    agentVersions.addMethod('GET', new apigateway.LambdaIntegration(getAgentVersionsHandler), authorizerProps);

    // S3 Bucket for static assets
    const staticAssetsBucket = new s3.Bucket(this, 'PromptWeaverStaticAssets', {
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'The ID of the Cognito User Pool',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'The ID of the Cognito User Pool Client',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'The URL of the API Gateway',
    });

    new cdk.CfnOutput(this, 'StaticAssetsUrl', {
      value: staticAssetsBucket.bucketWebsiteUrl,
      description: 'The URL of the static assets bucket',
    });
  }
}
