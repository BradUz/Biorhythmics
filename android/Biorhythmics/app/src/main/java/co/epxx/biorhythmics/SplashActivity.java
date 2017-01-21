package co.epxx.biorhythmics;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;

import co.epxx.biorhythmics.MainActivity;

public class SplashActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final Handler handler = new Handler();
        final SplashActivity self = this;
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                Intent intent = new Intent(self, MainActivity.class);
                self.startActivity(intent);
                self.finish();
            }
        }, 333);
    }
}
