package co.epxx.biorhythmics;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;


public class AlarmStartup extends BroadcastReceiver {
    public final String TAG = "Biorhythmics-Boot";

    @Override
    public void onReceive(Context arg0, Intent arg1) {
        Log.d(TAG, "bzzzed");
        Intent intent = new Intent(arg0, JavascriptEngine.class);
        arg0.startService(intent);
    }
}
