'use babel';

exports.test_fn = () =>
  console.log('hello')

exports.get_date_string_ex = get_date_string_ex = (dt) =>
     # 01, 02, 03, ... 29, 30, 31
      dd = dt.getDate();
      if dd < 10
        dd  = '0' + dd;
      # 01, 02, 03, ... 10, 11, 12
      MM = dt.getMonth() + 1;
      if MM < 10
        MM  = '0' + MM;

      # 1970, 1971, ... 2015, 2016, ...
      yyyy = dt.getFullYear();
      console.log(MM, dd, yyyy)
      # create the format you want
      (MM + "/" + dd + "/" + yyyy);

exports.get_date_string = (day_offset) =>
   dt = new Date();
   # console.log(dt);
   dt.setDate(dt.getDate() + day_offset);
   # console.log(dt);
   get_date_string_ex(dt)
