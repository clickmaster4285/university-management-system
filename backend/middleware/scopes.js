import { loadUserScopes } from '../utils/userScopes.js';

export const attachUserScopes = async (req, _res, next) => {
  try {
    req.scopes = await loadUserScopes(req.user);
    next();
  } catch (error) {
    next(error);
  }
};
