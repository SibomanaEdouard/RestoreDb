export interface Recipient {
  name: string;
  email: string;
}

export interface SendPulseEmail {
  email: {
    subject: string;
    from: {
      name: string;
      email: string;
    };
    to: Recipient[];
    template: {
      id: string;
      variables: {
        [key: string]: string;
      };
    };
  };
}
