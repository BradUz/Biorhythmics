package epxx.co.biorhythmics;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.TaskStackBuilder;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.AssetManager;
import android.os.Binder;
import android.os.Handler;
import android.os.IBinder;
import android.preference.PreferenceManager;
import android.support.v4.app.NotificationCompat;
import android.util.Log;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import java.io.IOException;
import java.io.InputStream;

public class JavascriptEngine extends Service {
    public final String TAG = "Biorhythmics-engine";
    Context rhino;
    Scriptable scope;
    String src;
    Handler h;

    public class LocalBinder extends Binder {
        JavascriptEngine getService() {
            return JavascriptEngine.this;
        }
    }

    private final IBinder mBinder = new LocalBinder();

    @Override
    public IBinder onBind(Intent intent) {
        return mBinder;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Received start id " + startId + ": " + intent);
        return START_STICKY;
    }

    @Override
    public void onCreate() {
        h = new Handler();

        try {
            AssetManager assetManager = getAssets();
            InputStream input;
            input = assetManager.open("main.js");

            int size = input.available();
            byte[] buffer = new byte[size];
            input.read(buffer);
            input.close();
            src = new String(buffer);

        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }

        rhino = Context.enter();
        rhino.setOptimizationLevel(-1);
        scope = rhino.initStandardObjects();
        Object this_js = Context.javaToJS(this, scope);
        ScriptableObject.putProperty(scope, "AndroidGateway", this_js);
        rhino.evaluateString(scope, src, "main.js", 1, null);

        final JavascriptEngine self = this;

        h.postDelayed(new Runnable() {
            public void run() {
                Log.d(TAG, "First run");
                self.determine_bio();
            }
        }, 5000);

    }

    private void determine_bio() {
        SharedPreferences sp = PreferenceManager.getDefaultSharedPreferences(this);
        String data = sp.getString("bio1", "");
        long last_notif = sp.getLong("last_notif", 0);
        Function f = (Function) scope.get("determine_bio", scope);
        Object[] params = new Object[]{data, last_notif};
        NativeArray jsret = (NativeArray) exec(f, params);

        Log.d(TAG, "Received array with " + jsret.getLength() + " items");
        String [] ret = new String[(int) jsret.getLength()];

        int j = 0;
        for (Object i: jsret.getIds()) {
            Integer ii = (Integer) i;
            String s = (String) jsret.get(ii, scope);
            Log.d(TAG, "Item " + ii + " " + j + " " + s);
            ret[j++] = s;
        }

        if (! ret[0].isEmpty()) {
            Log.d(TAG, "Notice: " + ret[0]);
        } else {
            SharedPreferences.Editor ed = sp.edit();
            ed.putLong("last_notif", System.currentTimeMillis() / 1000L);
            ed.apply();
            if (ret.length > 1) {
                notif(ret[1], 1);
            }
            if (ret.length > 2) {
                notif(ret[2], 2);
            }
        }

        final JavascriptEngine self = this;

        h.postDelayed(new Runnable() {
            public void run() {
                Log.d(TAG, "Periodic run");
                self.determine_bio();
            }
        }, 60 * 1000);
    }

    private void notif(String txt, Integer mId) {
        NotificationCompat.Builder mBuilder =
                new NotificationCompat.Builder(this)
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentTitle("Biorhythmics")
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(txt))
                        .setContentText(txt);

        Intent resultIntent = new Intent(this, MainActivity.class);

        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);
        stackBuilder.addParentStack(MainActivity.class);
        stackBuilder.addNextIntent(resultIntent);
        PendingIntent resultPendingIntent =
                stackBuilder.getPendingIntent(
                        0,
                        PendingIntent.FLAG_UPDATE_CURRENT
                );
        mBuilder.setContentIntent(resultPendingIntent);
        NotificationManager mNotificationManager =
                (NotificationManager)
                        getSystemService(android.content.Context.NOTIFICATION_SERVICE);
        mNotificationManager.notify(mId, mBuilder.build());
    }

    public void JSlog(String txt) {
        Log.w(TAG, "log " + txt);
    }

    private Object exec(Function f, Object[] params) {
        Object ret = null;

        try {
            ret = f.call(rhino, scope, scope, params);
        } catch (RhinoException e) {
            Log.e(TAG, "Exception in engine");
            Log.e(TAG, e.getMessage());
            Log.e(TAG, e.getScriptStackTrace());
        }

        return ret;
    }
}
