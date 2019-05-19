Install `libnfc` https://blog.stigok.com/2017/10/12/setting-up-a-pn532-nfc-module-on-a-raspberry-pi-using-i2c.html

In case i2c device is not detected do:
- Add the line (or uncomment) `dtparam=i2c_arm=on` to the file `/boot/config.txt`.
- Add the line `i2c-dev` to `/etc/modules`.
- _(didn't use)_ Remove the line `i2c-bcm2708` from `/etc/modules`.

_Source at https://raspberrypi.stackexchange.com/a/56028_

Additional info: https://github.com/fivdi/i2c-bus/blob/master/doc/raspberry-pi-i2c.md
