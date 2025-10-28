import cron from 'node-cron';
import Showtime from '../models/showtime.js';

const updateShowtimeStatus = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const showtimes = await Showtime.find({ status: 'active' }).populate('movie_id');

      for (const showtime of showtimes) {
        if (!showtime.movie_id) {
          console.error(`Showtime ${showtime._id} has no movie_id, skipping.`);
          continue;
        }
        const movieDuration = showtime.movie_id.duration;
        const twoThirdsDuration = (movieDuration * 2) / 3;
        const showtimeStartTime = new Date(showtime.start_time);
        const thresholdTime = new Date(showtimeStartTime.getTime() + twoThirdsDuration * 60000);

        if (now > thresholdTime) {
          showtime.status = 'inactive';
          await showtime.save();
          console.log(`Showtime ${showtime._id} status updated to inactive.`);
        }
      }
    } catch (error) {
      console.error('Error updating showtime statuses:', error);
    }
  });
};

export default updateShowtimeStatus;
