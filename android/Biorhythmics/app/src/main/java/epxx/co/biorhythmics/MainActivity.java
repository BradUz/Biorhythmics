package epxx.co.biorhythmics;

import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends AppCompatActivity {
    WebView html;
    public final String TAG = "Biorhythmics";

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

        if (AlarmHelper.expired()) {
            Log.d(TAG, "expired beta");
            finish();
            return;
        }

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
}
