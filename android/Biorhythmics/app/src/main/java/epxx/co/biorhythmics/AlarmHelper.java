package epxx.co.biorhythmics;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;

import java.util.Date;

/**
 * Created by epx on 11/1/16.
 */

public class AlarmHelper {
    static private AlarmManager manager;
    static final Date expiry = new Date(2017 - 1900, 06, 01);

    static public boolean expired() {
        Date d = new Date();
        return d.after(expiry);
    }

    public static void start(Context ctx) {
        if (manager != null) {
            return;
        }

        if (AlarmHelper.expired()) {
            return;
        }

        Intent alarmIntent = new Intent(ctx, AlarmReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(ctx, 0, alarmIntent, 0);
        manager = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        int interval = 60 * 1000;
        manager.setRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP,
                SystemClock.elapsedRealtime() + 1000,
                interval, pendingIntent);
    }
}
