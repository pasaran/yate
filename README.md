Yet Another Template Engine
============================

Бла-бла-бла
-----------

  * Хочется заменить шаблонизатор в Я.Почте.
    Сейчас это xslt, исполняющийся на клиенте.

  * Как минимум новые шаблоны должны уметь компилироваться в javascript и
    работать с даннымми в формате json, превращая их в html.

  * Не исключается также компиляция и в другие языки. Например, в perl.

  * Шаблонизатор должен быть быстрым.
    Поэтому синтаксис и набор фич ограничивается в первую очередь
    возможностью компиляции в быстро работающий javascript.

  * Шаблонизатор не должен никаким образом модифицировать входящие данные.

  * Синтаксис не должен быть xml'ным,
    но общие принципы xslt (pattern matching шаблонов, xpath) должны сохраниться.


Building and Installing
-----------------------

  * Нужно установить [node.js](https://github.com/joyent/node/wiki/Installation):

        git clone https://github.com/joyent/node.git
        cd node
        export JOBS=2 # optional, sets number of parallel commands.
        mkdir ~/local
        ./configure --prefix=$HOME/local/node
        make
        make install
        export PATH=$HOME/local/node/bin:$PATH

  * В корне yate нужно запустить make.sh.
    Эта команда сгенерит в корне же файл yate.js, который собственно и является компилятором.

  * Компиляция шаблона запускается так:

        node yate.js test.yate > test.js

  * В папке examples/mailbox есть довольно развесистый пример:

        cd examples/mailbox
        ./make.sh

    Файл `mailbox.js.html` -- это результат наложения шаблона "на сервере", а `run.html` -- на клиенте.

