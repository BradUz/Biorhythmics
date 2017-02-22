package co.epxx.biorhythmics;

import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.preference.PreferenceManager;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.InterstitialAd;
import com.google.firebase.analytics.FirebaseAnalytics;

import java.util.Date;

public class MainActivity extends AppCompatActivity {
    WebView html;
    private FirebaseAnalytics mFirebaseAnalytics;
    Handler h = new Handler();
    InterstitialAd mInterstitialAd;

    public final String TAG = "Biorhythmics";
    boolean on_screen = false;

    private class HelloWebViewClient extends WebViewClient {
    }

    @android.webkit.JavascriptInterface
    public void updateData(String b64data) {
        Log.d(TAG, "Data sent to native layer");
        SharedPreferences sp = PreferenceManager.getDefaultSharedPreferences(this);
        SharedPreferences.Editor ed = sp.edit();
        ed.putString("bio1", b64data);
        ed.apply();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mFirebaseAnalytics = FirebaseAnalytics.getInstance(this);
        mInterstitialAd = new InterstitialAd(this);
        mInterstitialAd.setAdUnitId("ca-app-pub-8045343011312408/8701091346");
        mInterstitialAd.setAdListener(new AdListener() {
            @Override
            public void onAdClosed() {
                requestNewInterstitial();
            }
        });
        requestNewInterstitial();
        h.postDelayed(new Runnable() {
            public void run() {
                checkAd();
            }
        }, 1000);

        setContentView(R.layout.activity_main);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        html = (WebView) findViewById(R.id.html);
        html.getSettings().setJavaScriptEnabled(true);
        // html.setVerticalScrollBarEnabled(false);
        html.addJavascriptInterface(this, "AndroidGateway");
        html.setWebViewClient(new HelloWebViewClient());
        html.setHorizontalScrollBarEnabled(false);
        html.setOnTouchListener(new View.OnTouchListener() {
            public boolean onTouch(View v, MotionEvent event) {
                return (event.getAction() == MotionEvent.ACTION_MOVE);
            }
        });
        html.getSettings().setDomStorageEnabled(true);
        html.getSettings().setDatabaseEnabled(true);
        html.getSettings().setLoadWithOverviewMode(true);
        html.getSettings().setUseWideViewPort(true);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
            html.getSettings().setDatabasePath("/data/data/" + html.getContext().getPackageName() + "/databases/");
        }
        html.loadUrl("file:///android_asset/index.html");

        AlarmHelper.start(this);
    }

    private void requestNewInterstitial() {
        AdRequest adRequest = new AdRequest.Builder()
                .addTestDevice(AdRequest.DEVICE_ID_EMULATOR)
                .addTestDevice("C797BD1E4CEAA2E9354CD6B48AB8B4C0")
                .build();

        mInterstitialAd.loadAd(adRequest);
    }

    private void checkAd()
    {
        Log.d(TAG, "checkAd");
        long to = 60000;
        long now = (new Date()).getTime();

        SharedPreferences sp = PreferenceManager.getDefaultSharedPreferences(this);
        long lastad = sp.getLong("lastad", now);
        if (lastad == now) {
            Log.d(TAG, "checkAd: first run");
            SharedPreferences.Editor ed = sp.edit();
            ed.putLong("lastad", now);
            ed.apply();
        }

        long next = lastad + 24*60*60*1000;
        boolean due = (now >= next) || (next > (now + 2*24*60*60*1000));

        if (due) {
            Log.d(TAG, "checkAd: due");
            to = 1000;
        } else {
            to = next - now + 1000;
        }

        if (mInterstitialAd.isLoaded() && on_screen && due) {
            Log.d(TAG, "checkAd: showing");
            showAd();
            SharedPreferences.Editor ed = sp.edit();
            ed.putLong("lastad", now);
            ed.commit();
        }

        h.postDelayed(new Runnable() {
            public void run() {
                checkAd();
            }
        }, to);
    }

    private void showAd() {
        if (mInterstitialAd.isLoaded()) {
            mInterstitialAd.show();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "on screen");
        on_screen = true;
    }

    @Override
    protected void onPause() {
        super.onPause();
        Log.d(TAG, "off screen");
        on_screen = false;
    }
}