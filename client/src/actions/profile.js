import axios from 'axios';
import { GET_PROFILE, PROFILE_ERROR } from './type';
import { setAlert } from './alert';

// Get current user profile
export const getCurrentProfile = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/profile/me');

    dispatch({
      type: GET_PROFILE,
      payload: res.data,
    });
  } catch (err) {
    console.log(err.response);
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response, status: err.response },
      // get error for statusText and status - should be correct thought
      // payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};
