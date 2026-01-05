// Firebase API Service
// Simple wrapper for Firebase backend

import firebaseAPI from './firebase-api';

// Export Firebase API
export const auth = firebaseAPI.auth;
export const db = firebaseAPI.db;
export const storage = firebaseAPI.storage;

// Collection APIs
export const dailyEntriesAPI = firebaseAPI.dailyEntries;
export const freePagesAPI = firebaseAPI.freePages;
export const wishlistAPI = firebaseAPI.wishlist;
export const lettersAPI = firebaseAPI.letters;
export const expensesAPI = firebaseAPI.expenses;
export const foodTrackingAPI = firebaseAPI.foodTracking;
export const exerciseTrackingAPI = firebaseAPI.exerciseTracking;
export const showsAPI = firebaseAPI.shows;
export const moviesAPI = firebaseAPI.movies;
export const peopleAPI = firebaseAPI.people;
export const favoritesAPI = firebaseAPI.favorites;
export const aboutMeAPI = firebaseAPI.aboutMe;

// Default export
export default {
  auth,
  db,
  storage,
  dailyEntries: dailyEntriesAPI,
  freePages: freePagesAPI,
  wishlist: wishlistAPI,
  letters: lettersAPI,
  expenses: expensesAPI,
  foodTracking: foodTrackingAPI,
  exerciseTracking: exerciseTrackingAPI,
  shows: showsAPI,
  movies: moviesAPI,
  people: peopleAPI,
  favorites: favoritesAPI,
  aboutMe: aboutMeAPI
};
