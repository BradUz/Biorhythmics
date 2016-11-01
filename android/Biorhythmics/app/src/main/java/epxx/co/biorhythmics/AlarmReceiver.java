package epxx.co.biorhythmics;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;


public class AlarmReceiver extends BroadcastReceiver {
    public final String TAG = "Biorhythmics-Alarm";

    @Override
    public void onReceive(Context arg0, Intent arg1) {
        Log.d(TAG, "buzzed");
        Intent intent = new Intent(arg0, JavascriptEngine.class);
        arg0.startService(intent);
    }
}
