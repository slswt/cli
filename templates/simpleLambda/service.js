import invokeWrapper from '@slswt/javascript/drivers/api/lambdaConnectors/invokeWrapper';

export const handler = async ({ message }) => {
  console.log(`Hello with ${message}`);
};

export const invoke = invokeWrapper(handler);
