import React from 'react';
import { Authenticator, useTheme, Button, Heading, View, TextField } from '@aws-amplify/ui-react';
import { Auth } from 'aws-amplify';

export function CustomAuthComponents() {
  const { tokens } = useTheme();

  const components = {
    SignIn: {
      Header() {
        return (
          <Heading level={3} padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}>
            Sign in to PromptWeaver
          </Heading>
        );
      },
      Footer() {
        return (
          <View textAlign="center" padding={tokens.space.large}>
            <Button
              fontWeight="normal"
              onClick={() => Auth.federatedSignIn({ provider: 'Google' })}
              variation="primary"
              backgroundColor="#4285F4"
              width="100%"
              marginBottom={tokens.space.small}
            >
              Sign in with Google
            </Button>
            <Button
              fontWeight="normal"
              onClick={() => Auth.federatedSignIn({ provider: 'LinkedIn' })}
              variation="primary"
              backgroundColor="#0077B5"
              width="100%"
            >
              Sign in with LinkedIn
            </Button>
          </View>
        );
      },
    },
    SignUp: {
      Header() {
        return (
          <Heading level={3} padding={`${tokens.space.xl} 0 0 ${tokens.space.xl}`}>
            Create a PromptWeaver Account
          </Heading>
        );
      },
      FormFields() {
        return (
          <>
            {/* Re-use default FormFields */}
            <Authenticator.SignUp.FormFields />

            {/* Add custom LinkedIn URL field */}
            <TextField
              name="custom:linkedin_url"
              label="LinkedIn URL"
              placeholder="https://www.linkedin.com/in/username"
              required={true}
            />
          </>
        );
      },
      Footer() {
        return (
          <View textAlign="center" padding={tokens.space.large}>
            <Button
              fontWeight="normal"
              onClick={() => Auth.federatedSignIn({ provider: 'Google' })}
              variation="primary"
              backgroundColor="#4285F4"
              width="100%"
              marginBottom={tokens.space.small}
            >
              Sign up with Google
            </Button>
            <Button
              fontWeight="normal"
              onClick={() => Auth.federatedSignIn({ provider: 'LinkedIn' })}
              variation="primary"
              backgroundColor="#0077B5"
              width="100%"
            >
              Sign up with LinkedIn
            </Button>
          </View>
        );
      },
    },
  };

  return components;
}
