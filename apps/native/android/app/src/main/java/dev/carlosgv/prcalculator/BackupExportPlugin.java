package dev.carlosgv.prcalculator;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "BackupExport")
public class BackupExportPlugin extends Plugin {
  private String pendingJson = null;

  @PluginMethod
  public void saveJson(PluginCall call) {
    String filename = call.getString("filename");
    String json = call.getString("json");
    String mimeType = call.getString("mimeType", "application/json");

    if (filename == null || filename.trim().isEmpty()) {
      call.reject("filename is required");
      return;
    }
    if (json == null) {
      call.reject("json is required");
      return;
    }

    pendingJson = json;

    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType(mimeType);
    intent.putExtra(Intent.EXTRA_TITLE, filename);

    startActivityForResult(call, intent, "onCreateDocumentResult");
  }

  @ActivityCallback
  private void onCreateDocumentResult(PluginCall call, ActivityResult result) {
    if (call == null) return;

    if (result.getResultCode() != Activity.RESULT_OK) {
      pendingJson = null;
      call.reject("USER_CANCELLED");
      return;
    }

    Uri uri = null;
    Intent data = result.getData();
    if (data != null) {
      uri = data.getData();
    }

    if (uri == null) {
      pendingJson = null;
      call.reject("No destination selected");
      return;
    }

    if (pendingJson == null) {
      call.reject("Missing pending file data");
      return;
    }

    try (OutputStream outputStream = getContext().getContentResolver().openOutputStream(uri, "w")) {
      if (outputStream == null) {
        call.reject("Could not open destination");
        return;
      }

      outputStream.write(pendingJson.getBytes(StandardCharsets.UTF_8));
      outputStream.flush();

      JSObject ret = new JSObject();
      ret.put("uri", uri.toString());
      call.resolve(ret);
    } catch (IOException e) {
      call.reject("Could not write backup file", e);
    } finally {
      pendingJson = null;
    }
  }
}
