In case i2c device is not detected do:
- Add the line (or uncomment) `dtparam=i2c_arm=on` to the file `/boot/config.txt`.
- _(didn't use)_ Remove the line `i2c-bcm2708` from `/etc/modules`.

_Source at https://raspberrypi.stackexchange.com/a/56028_
