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
          </View>
        );
      },
    },
  };

  return components;
}
