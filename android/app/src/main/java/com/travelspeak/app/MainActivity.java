package com.travelspeak.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int MIC_PERM_CODE = 1001;
    private PermissionRequest pendingWebPermission;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Web Speech API(webkitSpeechRecognition)가 마이크를 요청할 때
        // Android 시스템 권한 다이얼로그와 연결해줌
        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                boolean needsMic = false;
                for (String resource : request.getResources()) {
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                        needsMic = true;
                        break;
                    }
                }

                if (!needsMic) {
                    // 마이크 외 다른 요청 (카메라 등)은 거부
                    request.deny();
                    return;
                }

                // 이미 RECORD_AUDIO 권한이 있으면 바로 허용
                if (ContextCompat.checkSelfPermission(
                        MainActivity.this, Manifest.permission.RECORD_AUDIO)
                        == PackageManager.PERMISSION_GRANTED) {
                    request.grant(request.getResources());
                } else {
                    // 권한 없으면 시스템 권한 다이얼로그 표시, 결과 대기
                    pendingWebPermission = request;
                    ActivityCompat.requestPermissions(
                            MainActivity.this,
                            new String[]{Manifest.permission.RECORD_AUDIO},
                            MIC_PERM_CODE);
                }
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == MIC_PERM_CODE && pendingWebPermission != null) {
            if (grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                pendingWebPermission.grant(pendingWebPermission.getResources());
            } else {
                pendingWebPermission.deny();
            }
            pendingWebPermission = null;
        }
    }
}
