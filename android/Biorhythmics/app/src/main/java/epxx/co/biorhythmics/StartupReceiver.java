package epxx.co.biorhythmics;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class StartupReceiver extends BroadcastReceiver {
    public final String TAG = "Biorhythmics-Boot";

    @Override
    public void onReceive(Context arg0, Intent arg1) {
        Log.d(TAG, "booted");
        AlarmHelper.start(arg0);
    }

}
