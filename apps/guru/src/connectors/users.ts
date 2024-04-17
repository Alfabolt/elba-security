// import { GuruError } from './commons/error';

// export type GuruUser = {
//   id: string;
//   email: string;
// };

// type ApiResponseUser = {
//   user: GuruUser;
// };
// type Pagination = {
//   nextPage: string | null;
// };
// export const getUsers = async (token: string, email: string, page: string | null) => {
//   const url = `https://api.getguru.com/api/v1/members?token=${page ? `page=${token}` : ''}`;
//   console.log('url->', url);
//   const credentials = `${email}:${token}`;
//   const base64Credentials = btoa(credentials);

//   const response = await fetch(url, {
//     headers: {
//       Authorization: `Basic ${base64Credentials}`,
//       Accept: 'application/json',
//     },
//   });

//   if (!response.ok) {
//     throw new GuruError('Could not retrieve users', { response });
//   }

//   const responseData = await response.json();

//   // Map over the response data to extract users
//   const users: GuruUser[] = responseData.map((item: ApiResponseUser) => ({
//     id: item.user.id,
//     email: item.user.email,
//   }));
//   const pagination: Pagination = {
//     nextPage: null,
//   };
//   const linkHeader = response.headers.get('Link');
//   if (linkHeader) {
//     const match = /<(?<url>[^>]+)>/.exec(linkHeader);
//     if (match?.groups?.url) {
//       const parsedUrl = new URL(match.groups.url);
//       pagination.nextPage = parsedUrl.searchParams.get('token');
//     }
//   }
//   console.log('pagination->', pagination);
//   return { users, pagination };
// };

import { GuruError } from './commons/error';

export type GuruUser = {
  id: string;
  email: string;
};

type ApiResponseUser = {
  user: GuruUser;
};
type Pagination = {
  nextPage: string | null;
};
export const getUsers = async (token: string, email: string, page: string | null) => {
  const url = 'https://api.getguru.com/api/v1/members/';

  const credentials = `${email}:${token}`;
  const base64Credentials = btoa(credentials);

  const fullUrl = page ? `${url}?token=${page}` : url;

  const response = await fetch(fullUrl, {
    headers: {
      Authorization: `Basic ${base64Credentials}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new GuruError('Could not retrieve users', { response });
  }

  const responseData = await response.json();

  // Map over the response data to extract users
  const users: GuruUser[] = responseData.map((item: ApiResponseUser) => ({
    id: item.user.id,
    email: item.user.email,
  }));

  const pagination: Pagination = {
    nextPage: null,
  };

  const linkHeader = response.headers.get('Link');
  if (linkHeader) {
    const match = /<(?<url>[^>]+)>/.exec(linkHeader);
    if (match?.groups?.url) {
      const parsedUrl = new URL(match.groups.url);
      pagination.nextPage = parsedUrl.searchParams.get('token');
    }
  }

  console.log('pagination->', pagination);
  return { users, pagination };
};
